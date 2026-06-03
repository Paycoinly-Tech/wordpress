<?php

require_once plugin_dir_path(__FILE__) . 'constants.php';
require_once plugin_dir_path(__FILE__) . 'paycoinly-wc-gateway.php';
require_once plugin_dir_path(__FILE__) . 'block.php';

class Paycoinly {

    public function __construct() { }

    public function run() {
        add_shortcode(PAYCOINLY_ID, [$this, 'shortcode']);

        add_action('init', [$this, 'register_hooks']);

        // Add menu item
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

        if (!class_exists('WC_Payment_Gateway')) {
            return;
        }

        add_filter('woocommerce_payment_gateways', function ($gateways) {
            $gateways[] = 'Paycoinly_WC';
            return $gateways;
        });
    }

    public function register_hooks() {
        // Hook registration
    }

    private function shortcode($atts) {
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
        $onclick = "window.open('{$url}', 'Pay with PayCoinly', 'width=800,height=550,left=200,top=100')";
        $render = "<button onclick=\"{$onclick}\" class=\"{$atts['class']}\" style=\"{$atts['style']}\">";
        $render .= "<img src='https://ambx.vercel.app/logo/light.svg' style='width: 150px;' />";
        $render .= "</button>";

        return $render;
    }

    public function settings_page() {

        $settings = get_option(PAYCOINLY_OPTION_KEY, []);

        ?>
        <div class="wrap">
            <h1><?php echo PAYCOINLY_TITLE; ?> Settings</h1>
            <style>
                .paycoinly_settings_form {
                    margin-top: 1em;
                }
                .paycoinly_settings_container label {
                    display: grid;
                    gap: .5em;
                    margin-bottom: 1em;
                }
            </style>
            <form method="post" action="options.php" class='paycoinly_settings_form'>
                <?php
                settings_fields(PAYCOINLY_ID . '_setting_group');
                ?>

                <div class='paycoinly_settings_container'>
                    <label>
                        API Key
                        <input
                            type="text"
                            name="<?php echo PAYCOINLY_OPTION_KEY; ?>[api_key]"
                            value="<?php echo esc_attr($settings['api_key'] ?? ''); ?>"
                            class="regular-text"
                        />
                    </label>
                </div>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}
