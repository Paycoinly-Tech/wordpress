<?php

if (!defined('ABSPATH'))
    exit;

define('PAYCOINLY_ID', 'paycoinly');
define('PAYCOINLY_TITLE', 'Paycoinly');
define('PAYCOINLY_OPTION_KEY', PAYCOINLY_ID . '_settings');
define('PAYCOINLY_DESCRIPTION', 'Crypto Payment Platform for WooCommerce');
define('PAYCOINLY_DOMAIN', 'https://app.paycoinly.xyz');
define('PAYCOINLY_DOCS_URL', 'https://www.paycoinly.xyz/docs/integrations/wordpress');
define('PAYCOINLY_VERSION', '1.0.0');

define('PAYCOINLY_ACTION_BEFORE_HANDLE_WC_PAYMENT', PAYCOINLY_ID . '_before_handle_wc_payment');
define('PAYCOINLY_ACTION_HANDLE_PAYMENT', PAYCOINLY_ID . '_handle_payment');
define('PAYCOINLY_FILTER_ORDER_PRICE', PAYCOINLY_ID . '_order_price');
