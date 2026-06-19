<?php

if (!defined('ABSPATH'))
    exit;

require_once plugin_dir_path(__FILE__) . 'constants.php';

function paycoinly_payment_token(
    $payment_id,
    $order_id,
    $price,
    $currency,
    $local_currency,
    $mode,
    $api_key)
{
    $body = [
        'price' => floatval($price),
        'currency'=> $currency,
        'localCurrency' => $local_currency,
        'metadata' => [
            'order_id' => $order_id,
            'user_id' => get_current_user_id(),
            'mode' => $mode,
        ]
    ];

    $headers = [
        'Content-Type: application/json',
        "x-api-key: {$api_key}"
    ];

    $url = PAYCOINLY_DOMAIN . "/v1/pay/{$payment_id}";

    $response = wp_remote_post($url, array(
        'method'  => 'POST',
        'headers' => $headers,
        'body' => wp_json_encode($body),
        )
    );

    if (is_wp_error($response)) {
        $err = $response->get_error_message();
        throw new Exception(esc_html("error getting payment token: {$err}"));
    }

    $code = wp_remote_retrieve_response_code( $response );
    $response = wp_remote_retrieve_body($response);
    $result = json_decode($response, true);
    
    if ($code !== 200) {
        throw new Exception(esc_html("error getting payment token: {$response['error']}"));
    }


    return $result['token'];
}
