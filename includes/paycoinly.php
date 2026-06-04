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
            'plugin_action_links',
            function ($links) use ($settings_slug) {
                $settings_link = '<a href="' . admin_url('admin.php?page=' . $settings_slug) . '">Settings</a>';

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

            register_rest_route(PAYCOINLY_ID, '/process-payment/(?P<mode>[^/]+)', [
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

        $price = apply_filters(PAYCOINLY_FILTER_GET_ORDER_PRICE, $order_id);
        $token = payment_token(
            $settings['payment_id'],
            $order_id,
            $price,
            $settings['api_key']
        );

        return [
            'result' => 'success',
            'redirect' => PAYCOINLY_DOMAIN . "/pay?token={$token}"
        ];
    }

    /**
     * Url: https://yourstore.com/wp-json/paycoinly/process-payment/:mode
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
        $mode = $request->get_param('mode');

        if ($mode == 'wc') {
            if (class_exists('WooCommerce')) {
                do_action(PAYCOINLY_ACTION_BEFORE_HANDLE_WC_PAYMENT, $payload);
                $order = wc_get_order($payload['order_id']);

                if (!$order) {
                    return new WP_REST_Response([
                        'error' => 'Order not found'
                    ], 404);
                }

                $order->payment_complete($payload['txLink']);

                // Empty cart
                // WC()->cart->empty_cart();

                $order->add_order_note(
                    'Order processed'
                );
            }
        }

        do_action(
            PAYCOINLY_ACTION_HANDLE_PAYMENT,
            $payload['order_id'],
            $payload['user_id'],
            $mode,
            $payload,
        );

        return ['success' => true];
    }

    private function shortcode($atts)
    {
        $atts = shortcode_atts(
            array(
                'payment_id' => 'Guest',
                'order_id' => '',
                'class' => '',
                'style' => '',
            ),
            $atts,
        );

        $url = get_rest_url(null, "paycoinly/order/{$atts['order_id']}");
        $onclick = "window.open('$url', 'Pay with PayCoinly', 'width=800,height=550,left=200,top=100')";
        $render = "<button onclick=\"$onclick\" class=\"{$atts['class']}\" style=\"{$atts['style']}\">";
        $render .= "<img src='https://ambx.vercel.app/logo/light.svg' style='width: 150px;' />";
        $render .= "</button>";

        return $render;
    }

    public function settings_page()
    {
        $settings = get_option(PAYCOINLY_OPTION_KEY, []);

        inject_setting_view_script($settings, PAYCOINLY_OPTION_KEY);

        ?>
        <div class="wrap">
            <h1><?php echo PAYCOINLY_TITLE; ?> Settings</h1>
            <form method="post" action="options.php" class='paycoinly_settings_form'>
                <?php
                settings_fields(PAYCOINLY_ID . '_setting_group');
                ?>

                <div class="form-table"><?php echo spinner() ?></div>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}
