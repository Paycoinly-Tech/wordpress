<?php

if (!defined('ABSPATH'))
    exit;

require_once plugin_dir_path(__FILE__) . 'constants.php';

function inject_setting_view_script($settings, $option_key)
{
    $script_handle = PAYCOINLY_ID . '-setting-script';

    wp_enqueue_script(
        $script_handle,
        plugin_dir_url(__FILE__) . '../assets/settings.js'
    );

    $settings['server_url'] = PAYCOINLY_DOMAIN;

    if ($option_key) {
        $settings['option_key'] = $option_key;
    }

    if (class_exists('WooCommerce')) {
        $settings['wc'] = true;
    }

    wp_localize_script(
        $script_handle,
        '__$' . PAYCOINLY_ID . '_settings',
        $settings
    );
}
