<?php

if (!defined('ABSPATH'))
    exit;

if (!class_exists('WooCommerce')) {
    return;
}

require_once plugin_dir_path(__FILE__) . 'constants.php';

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

add_action(
    'woocommerce_blocks_loaded',
    function () {

        if (
            !class_exists(AbstractPaymentMethodType::class)
        ) {
            return;
        }

        add_action(
            'woocommerce_blocks_payment_method_type_registration',
            function ($registry) {
                $registry->register(
                    new Paycoinly_Blocks_Support()
                );
            }
        );
    }
);

final class Paycoinly_Blocks_Support extends AbstractPaymentMethodType
{
    protected $name = PAYCOINLY_ID;

    public function initialize()
    {
        $this->settings = get_option(PAYCOINLY_OPTION_KEY, []);
    }

    public function is_active()
    {
        return !empty($this->settings['enabled'])
            && $this->settings['enabled'] === 'yes';
    }

    public function get_payment_method_script_handles()
    {
        wp_register_script(
            'paycoinly-blocks',
            plugin_dir_url(dirname(__FILE__)) . 'assets/wc-blocks.js',
            [
                'wc-blocks-registry',
                'wc-settings',
                'wp-element',
                'wp-html-entities'
            ],
            PAYCOINLY_VERSION,
            true
        );

        return ['paycoinly-blocks'];
    }

    public function get_payment_method_data()
    {
        return [
            'title' => PAYCOINLY_TITLE,
            'description' => PAYCOINLY_DESCRIPTION
        ];
    }
}
