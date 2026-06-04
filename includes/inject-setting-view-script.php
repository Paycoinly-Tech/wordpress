<?php

if (!defined('ABSPATH'))
    exit;

require_once plugin_dir_path(__FILE__) . 'constants.php';

function inject_setting_view_script($settings, $option_key)
{
    $script_handle = PAYCOINLY_ID . '-setting-script';

    wp_enqueue_script(
        $script_handle,
        plugin_dir_url(__FILE__) . '../setting/dist/assets/index.js',
        [],
        '1.0.0',
        true    
    );

    $script = "window.__$"  . PAYCOINLY_ID . "_settings = " . json_encode($settings) . ";";

    if ($option_key) {
        $script .= "window.__$"  . PAYCOINLY_ID . "_settings.option_key = '$option_key';";

        if (class_exists('WooCommerce')) {
            $script .= "window.__$"  . PAYCOINLY_ID . "_settings.wc = true;";
        }
    }

    wp_add_inline_script(
        $script_handle,
        $script,
        'before'
    );
}
