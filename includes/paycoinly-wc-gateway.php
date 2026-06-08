<?php

if (!defined('ABSPATH'))
    exit;

require_once plugin_dir_path(__FILE__) . 'constants.php';
require_once plugin_dir_path(__FILE__) . 'inject-setting-view-script.php';
require_once plugin_dir_path(__FILE__) . 'ui.php';

class Paycoinly_WC extends WC_Payment_Gateway
{

    public function __construct()
    {
        $this->id = PAYCOINLY_ID;
        $this->method_title = PAYCOINLY_TITLE;
        $this->method_description = PAYCOINLY_DESCRIPTION;
        $this->has_fields = true;

        $this->supports = [
            'products'
        ];

        $this->init_settings();
        $this->init_form_fields();

        $this->title = 'Paycoinly';
        $this->icon = 'https://app.paycoinly.xyz/favicon.ico';

        add_action(
            'woocommerce_update_options_payment_gateways_' . $this->id,
            [$this, 'process_admin_options']
        );
    }

    public function process_payment($order_id)
    {
        $order = wc_get_order($order_id);

        $thank_you = $order->get_checkout_order_received_url();

        $token = payment_token(
            $this->settings['wc_payment_id'],
            $order_id,
            $order->get_total(),
            $order->get_currency() ?? 'USD',
            $order->get_currency() ?? 'USD',
            $this->settings['api_key']
        );

        return [
            'result' => 'success',
            'redirect' => PAYCOINLY_DOMAIN . "/pay?token={$token}&redirect={$thank_you}"
        ];
    }

    /**
     * Admin settings
     */
    public function init_form_fields()
    {
        $this->form_fields = [
            'enabled' => [
                'title' => 'Active',
                'type' => 'checkbox',
            ],

            'api_key' => [
                'title' => 'API Key',
                'type' => 'text',
            ],

            'wc_payment_id' => [
                'title' => 'Payment ID',
                'type' => 'text',
            ],
        ];
    }

    public function init_settings()
    {
        parent::init_settings();
        $this->settings['enabled'] = $this->settings['enabled'] ?? 'yes';
    }

    public function generate_settings_html($form_fields = array(), $echo = true)
    {
        inject_setting_view_script($this->settings, null);

        return spinner();
    }

    public function get_field_key($key)
    {
        return $key;
    }

    public function get_option_key()
    {
        return PAYCOINLY_OPTION_KEY;
    }

    public function payment_fields()
    {
        echo PAYCOINLY_DESCRIPTION;
    }
}
