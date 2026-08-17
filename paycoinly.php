<?php
/**
 * Copyright (C) 2026 Paycoinly
 * SPDX-License-Identifier: GPL-3.0-or-later
 * 
 * Plugin Name: Paycoinly
 * Description: Integrate crypto payments gateway powered by Paycoinly into WordPress or WooCommerce easily.
 * Version: 1.0.0
 * Author: Paycoinly
 * Author URI: https://www.paycoinly.xyz
 * 
 * Requires at least: 4.7
 * Tested up to: 7.0
 * 
 * License: GNU General Public License v3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 */

if (!defined('ABSPATH'))
    exit;

add_action('plugins_loaded', function () {
    require_once plugin_dir_path(__FILE__) . 'includes/paycoinly.php';

    $paycoinly = new Paycoinly();
    $paycoinly->run();
});
