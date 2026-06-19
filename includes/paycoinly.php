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
                    // 'sanitize_callback' => 'my_plugin_sanitize_settings',
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

        add_filter(
            'plugin_action_links_' . plugin_basename(dirname(__DIR__)) . '/' . PAYCOINLY_ID . '.php',
            function ($links) use ($settings_slug) {
                $settings_link = '<a href="' . admin_url('admin.php?page=' . $settings_slug) . '">Settings</a>';
                $docs_link = '<a href="' . PAYCOINLY_DOCS_URL . '">Docs</a>';

                array_unshift($links, $docs_link);
                array_unshift($links, $settings_link);

                return $links;
            }
        );

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
        $settings = get_option(PAYCOINLY_OPTION_KEY, []);
        $order_id = $request->get_param('id');

        $token = paycoinly_payment_token(
            $settings['payment_id'],
            $order_id,
            apply_filters(PAYCOINLY_FILTER_ORDER_PRICE, $order_id),
            'USD',
            'USD',
            'wp',
            $settings['api_key']
        );

        $response = new WP_REST_Response();

        $response->set_status(302);

        $location = "/pay?token={$token}";

        $redirect = $request->get_param("redirect");

        if ($redirect) {
            $location = add_query_arg(["redirect" => $redirect], $location);
        }

        $response->header('Location', PAYCOINLY_DOMAIN . $location);

        return $response;
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
                        'error' => 'Woocommerce order not found'
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
                'on_complete' => 'console.log(event.data.payload);',
                'redirect' => '',
                'class' => '',
                'style' => '',
                'html' => "<img src='" . PAYCOINLY_DOMAIN . "/logo/dark.svg' style='width: 5em;' />",
            ),
            $atts,
        );

        $url = get_rest_url(null, "paycoinly/order/{$atts['order_id']}");

        if ($atts["redirect"]) {
            $parsed = wp_parse_url($atts['redirect']);

            if (!isset($parsed['scheme']) || !isset($parsed['host'])) {
                $host = home_url();
                $atts["redirect"] = "https://{$host}/" . ltrim($atts["redirect"], '/');
            }

            $url = get_rest_url(null, "paycoinly/order/{$atts['order_id']}?redirect={$atts['redirect']}");
        }

        $onclick = "window.open('$url', 'Pay with PayCoinly', 'width=800,height=550,left=200,top=100')";

        if ($atts["redirect"]) {
            $onclick = "location.href='$url'";
        }

        $render = "<button onclick=\"$onclick\" class=\"{$atts['class']}\" style=\"{$atts['style']}\">";
        $render .= html_entity_decode($atts['html']);
        $render .= "</button>";

        $script = "
            window.addEventListener('message', (event) => {
                if (event.origin !== '" . PAYCOINLY_DOMAIN . "') {
                    return;
                }

                if (event.data.type === 'PAYCOINLY_PAYMENT_COMPLETE') {
                    if (event.data.payload.metadata.order_id === {$atts['order_id']}) {
                        {$atts['on_complete']}
                    }
                }
            });
        ";

        $handler = PAYCOINLY_ID . '-payment-complete-handler-script';

        wp_register_script($handler, '', [], PAYCOINLY_VERSION, true);
        wp_enqueue_script($handler);
        wp_add_inline_script($handler, $script);

        return $render;
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

                <div class="form-table" style="display: flex;"><?php echo esc_html(paycoinly_spinner()) ?></div>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}
