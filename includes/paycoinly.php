<?php

if (!defined('ABSPATH'))
    exit;

require_once plugin_dir_path(__FILE__) . 'constants.php';
require_once plugin_dir_path(__FILE__) . 'paycoinly-wc-gateway.php';
require_once plugin_dir_path(__FILE__) . 'block.php';
require_once plugin_dir_path(__FILE__) . 'payment-token.php';
require_once plugin_dir_path(__FILE__) . 'ui.php';
require_once plugin_dir_path(__FILE__) . 'inject-setting-view-script.php';

class Paycoinly
{
    public function __construct()
    {
    }

    public function run()
    {
        add_shortcode(PAYCOINLY_ID, [$this, 'shortcode']);

        $settings_slug = PAYCOINLY_ID . '-settings';

        add_action('admin_init', function () {
            register_setting(
                PAYCOINLY_ID . '_setting_group',
                PAYCOINLY_OPTION_KEY,
                [
                    'type' => 'array',
                    'sanitize_callback' => function ($input) {
                        return [
                            'enabled' => $input['enabled'] === 'yes' ? 'yes' : 'no',
                            'api_key' => sanitize_text_field($input['api_key'] ?? ''),
                            'payment_id' => sanitize_text_field($input['payment_id'] ?? ''),
                            'wc_payment_id' => sanitize_text_field($input['wc_payment_id'] ?? '')
                        ];
                    },
                    'default' => [],
                ]
            );
        });

        add_action(
            'admin_menu',
            function () use ($settings_slug) {
                add_menu_page(
                    PAYCOINLY_TITLE . ' Settings',
                    PAYCOINLY_TITLE,
                    'manage_options',
                    $settings_slug,
                    [$this, 'settings_page'],
                    'dashicons-admin-generic',
                    30
                );
            }
        );

        $plugin_basename = plugin_basename(dirname(__DIR__)) . '/' . PAYCOINLY_ID . '.php';

        add_filter(
            "plugin_action_links_{$plugin_basename}",
            function ($links) use ($settings_slug) {
                $settings_link = '<a href="' . admin_url('admin.php?page=' . $settings_slug) . '">Settings</a>';

                array_unshift($links, $settings_link);

                return $links;
            }
        );

        add_filter('plugin_row_meta', function ($links, $file) use ($plugin_basename) {
            if ($file === $plugin_basename) {
                $links[] = '<a href="' . PAYCOINLY_DOCS_URL . '" target="_blank">Docs</a>';
            }

            return $links;
        }, 10, 2);

        add_action('rest_api_init', function () {
            register_rest_route(PAYCOINLY_ID, '/process-payment', [
                'methods' => 'POST',
                'callback' => [$this, 'payment_handler'],
                'permission_callback' => '__return_true',
            ]);

            register_rest_route(PAYCOINLY_ID, '/order/(?P<id>[^/]+)', [
                'methods' => 'GET',
                'callback' => [$this, 'get_payment_token'],
                'permission_callback' => '__return_true',
            ]);
        });

        if (!class_exists('WC_Payment_Gateway')) {
            return;
        }

        add_filter('woocommerce_payment_gateways', function ($gateways) {
            $gateways[] = 'Paycoinly_WC';
            return $gateways;
        });
    }

    /**
     * Url: https://yourstore.com/wp-json/paycoinly/order/{id}
     */
    function get_payment_token(WP_REST_Request $request)
    {
        $response = new WP_REST_Response();

        try {
            $settings = get_option(PAYCOINLY_OPTION_KEY, []);
            $order_id = $request->get_param('id');
            $price = apply_filters(PAYCOINLY_FILTER_ORDER_PRICE, $order_id);

            if (is_null($price)) {
                $err = sprintf(
                    "Null price for order id '%s'. Please check %s filter usage. %s",
                    $order_id,
                    PAYCOINLY_FILTER_ORDER_PRICE,
                    "https://www.paycoinly.xyz/docs/appendix/wordpress-plugin-hooks#paycoinly_order_price"
                );
                throw new Exception($err);
            }

            $token = paycoinly_payment_token(
                $settings['payment_id'],
                $order_id,
                $price,
                'USD',
                'USD',
                'wp',
                $settings['api_key']
            );

            $location = "/pay?token={$token}";
            $redirect = $request->get_param("redirect");

            if ($redirect) {
                $location = add_query_arg(["redirect" => $redirect], $location);
            }

            $response->header('Location', PAYCOINLY_DOMAIN . $location);
            $response->set_status(302);
        } catch (Exception $e) {
            $response->set_data($e->getMessage());
        } finally {
            return $response;
        }
    }

    /**
     * Url: https://yourstore.com/wp-json/paycoinly/process-payment
     */
    function payment_handler(WP_REST_Request $request)
    {
        $settings = get_option(PAYCOINLY_OPTION_KEY, []);
        $api_key = $request->get_header('x-api-key');

        if ($api_key !== $settings['api_key']) {
            return new WP_REST_Response([
                'error' => 'Unauthorized'
            ], 401);
        }

        $payload = $request->get_json_params();
        $mode = $payload['mode'];

        if ($mode == 'wc') {
            if (class_exists('WooCommerce')) {
                do_action(PAYCOINLY_ACTION_BEFORE_HANDLE_WC_PAYMENT, $payload);
                $order = wc_get_order($payload['order_id']);

                if (!$order) {
                    do_action(
                        PAYCOINLY_ACTION_HANDLE_PAYMENT,
                        $payload,
                        $mode,
                    );

                    return new WP_REST_Response([
                        'error' => 'WooCommerce order not found'
                    ], 404);
                }

                $order->payment_complete($payload['txLink']);

                $order->add_order_note(
                    'Order processed by Paycoinly'
                );
            }
        }

        do_action(
            PAYCOINLY_ACTION_HANDLE_PAYMENT,
            $payload,
            $mode,
        );

        return ['success' => true];
    }

    public function shortcode($atts)
    {
        $atts = shortcode_atts(
            array(
                'order_id' => '',
                'redirect' => '',
                'class' => '',
                'style' => '',
                'html' => "<img src='" . PAYCOINLY_DOMAIN . "/logo/dark.svg' style='width: 5em;' />",
            ),
            $atts,
        );

        $url = get_rest_url(null, "paycoinly/order/{$atts['order_id']}");
        $onclick = '';

        if ($atts["redirect"]) {
            $parsed = wp_parse_url($atts['redirect']);

            if (!isset($parsed['scheme']) || !isset($parsed['host'])) {
                $atts["redirect"] = home_url() . $atts["redirect"];
            }

            $url .= "?redirect={$atts['redirect']}";
            $onclick = "location.href='$url'";
        } else {
            $onclick = "window.open('$url', 'Pay with PayCoinly', 'width=800,height=550,left=200,top=100')";
        }

        $script = sprintf(
            "window.addEventListener('message', (event) => {
                if (event.origin !== '%s') {
                    return;
                }

                if (event.data.type === 'PAYCOINLY_PAYMENT_COMPLETE') {
                    if (event.data.payload.metadata.order_id === %s) {
                        %s
                    }
                }
            });",
            PAYCOINLY_DOMAIN,
            wp_json_encode($atts['order_id']),
            apply_filters(PAYCOINLY_FILTER_ON_COMPLETE, "console.log(event.data.payload);")
        );

        $handler = PAYCOINLY_ID . '-payment-complete-handler-script';

        wp_register_script($handler, '', [], PAYCOINLY_VERSION, true);
        wp_enqueue_script($handler);
        wp_add_inline_script($handler, $script);

        return sprintf(
            "<button onclick=\"%s\" class=\"%s\" style=\"%s\">%s</button>",
            esc_attr($onclick),
            esc_attr($atts['class']),
            esc_attr($atts['style']),
            wp_kses_post($atts['html']), // not escaped as it's a HTML snippet rendered directly. Safe to use intact as it's provided by admin
        );
    }

    public function settings_page()
    {
        $settings = get_option(PAYCOINLY_OPTION_KEY, []);

        paycoinly_inject_setting_view_script($settings, PAYCOINLY_OPTION_KEY);

        ?>
        <div class="wrap">
            <h1><?php echo esc_html(PAYCOINLY_TITLE); ?> Settings</h1>
            <form method="post" action="options.php" class='paycoinly_settings_form'>
                <?php
                settings_fields(PAYCOINLY_ID . '_setting_group');
                ?>

                <div class="form-table" style="display: flex;"><?php echo wp_kses_post(paycoinly_spinner()) ?></div>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}
