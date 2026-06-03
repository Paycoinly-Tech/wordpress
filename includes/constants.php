<?php

define('PAYCOINLY_ID', 'paycoinly');
define('PAYCOINLY_TITLE', 'Paycoinly');
define('PAYCOINLY_OPTION_KEY', PAYCOINLY_ID . '_settings');
define('PAYCOINLY_DESCRIPTION', 'Crypto Payment Platform for Woocommerce');
// define('PAYCOINLY_DOMAIN', 'https://app.paycoinly.xyz');
define('PAYCOINLY_DOMAIN', 'https://ambx.vercel.app');

define('PAYCOINLY_FILTER_BEFORE_HANDLE_WC_PAYMENT', PAYCOINLY_ID . '_before_handle_wc_payment');
define('PAYCOINLY_FILTER_HANDLE_PAYMENT', PAYCOINLY_ID . '_handle_payment');
define('PAYCOINLY_FILTER_GET_PRICE', PAYCOINLY_ID . '_get_price');
