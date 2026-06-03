<?php

if (!defined('ABSPATH')) exit;

require_once plugin_dir_path(__FILE__) . 'constants.php';

class Paycoinly_WC extends WC_Payment_Gateway
{

    public function __construct()
    {
        $this->id                 = PAYCOINLY_ID;
        $this->method_title       = PAYCOINLY_TITLE;
        $this->method_description = PAYCOINLY_DESCRIPTION;
        $this->has_fields         = true;

        $this->supports = [
            'products'
        ];

        $this->init_settings();
        $this->init_form_fields();

        $this->title    = 'Paycoinly';

        add_action(
            'woocommerce_update_options_payment_gateways_' . $this->id,
            [$this, 'process_admin_options']
        );
    }

    public function process_payment($order_id)
    {
        $order = wc_get_order($order_id);
        $token = payment_token(
            $this->settings['payment_id'],
            $order_id,
            $order->get_total(),
            $this->settings['api_key']
        );

        return [
            'result'   => 'success',
            'redirect' => PAYCOINLY_DOMAIN . "/pay?token=${token}"
        ];
    }

    /**
     * Admin settings
     */
    public function init_form_fields()
    {
        $this->form_fields = [
            'enabled' => [
                'title'   => 'Active',
                'type'    => 'checkbox',
                'description'   => 'Activate Paycoinly Gateway',
                'default' => $this->settings['enabled'] ?? 'yes',
            ],

            'api_key' => [
                'title'   => 'API Key',
                'type'    => 'text',
                'description'   => 'Enter your Paycoinly API Key',
                'default' => '',
            ],

            'payment_id' => [
                'title'   => 'Payment ID',
                'type'    => 'text',
                'description'   => 'Enter your Paycoinly Payment Id',
                'default' => '',
            ],
        ];
    }

    public function get_field_key( $key ) {
		return $key;
	}

	public function get_option_key() {
		return PAYCOINLY_OPTION_KEY;
	}

    public function payment_fields()
    {
        echo PAYCOINLY_DESCRIPTION;
    }
}
