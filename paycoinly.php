<?php
/**
 * Plugin Name: Paycoinly
 * Description: Crypto Payment Gateway
 * Version: 1.0.0
 * Author: Paycoinly
 * Author URI: https://www.paycoinly.xyz
 */

if (!defined('ABSPATH'))
    exit;

add_action('plugins_loaded', function () {
    require_once plugin_dir_path(__FILE__) . 'includes/paycoinly.php';

    $paycoinly = new Paycoinly();
    $paycoinly->run();
});
