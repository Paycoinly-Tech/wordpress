<?php

if (!defined('ABSPATH')) exit;

require_once plugin_dir_path(__FILE__) . 'constants.php';
require_once plugin_dir_path(__FILE__) . 'payment-token.php';

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

        add_action('rest_api_init', function () {

            register_rest_route('paycoinly', '/process-payment', [
                'methods'  => 'POST',
                'callback' => [$this, 'payment_handler'],
                'permission_callback' => '__return_true',
            ]);

            register_rest_route('paycoinly', '/order/(?P<id>\d+)', [
                'methods'  => 'GET',
                'callback' => [$this, 'get_payment_token'],
                'permission_callback' => '__return_true',
            ]);

        });
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
     * Url: https://yourstore.com/wp-json/paycoinly/order/{id}
     */
    function get_payment_token(WP_REST_Request $request)
    {
        $order_id = $request->get_param('id');

        // TODO: get price from order id

        $token = payment_token(
            $this->settings['payment_id'],
            $order_id,
            'price',
            $this->settings['api_key']
        );

        return [
            'result'   => 'success',
            'redirect' => PAYCOINLY_DOMAIN . "/pay?token=${token}"
        ];
    }
    
    /**
     * Url: https://yourstore.com/wp-json/paycoinly/process-payment
     */
    function payment_handler(WP_REST_Request $request)
    {
        $api_key = $request->get_header('x-api-key');

        if ($api_key !== $this->settings['api_key']) {
            return new WP_REST_Response([
                'error' => 'Unauthorized'
            ], 401);
        }

        $payload = $request->get_json_params();

        $order = wc_get_order($payload['order_id']);

        if (!$order) {
            return new WP_REST_Response([
                'error' => 'Order not found'
            ], 404);
        }

        $order->payment_complete(
            PAYCOINLY_DOMAIN . "/tx/{$payload['txid']}"
        );

        // Empty cart
        // WC()->cart->empty_cart();

        $order->add_order_note(
            'Order processed'
        );

        return ['success' => true];
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
