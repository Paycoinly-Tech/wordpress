<?php

require_once plugin_dir_path(__FILE__) . 'constants.php';

function payment_token(
    $payment_id,
    $order_id,
    $price,
    $currency,
    $local_currency,
    $api_key)
{
    $data = [
        'price' => floatval($price),
        'currency'=> $currency,
        'localCurrency' => $local_currency,
        'metadata' => [
            'order_id' => $order_id,
            'user_id' => get_current_user_id()
        ]
    ];

    $headers = [
        'Content-Type: application/json',
        "x-api-key: {$api_key}"
    ];

    $endpoint = PAYCOINLY_DOMAIN . "/v1/pay/{$payment_id}";
    $ch = curl_init($endpoint);

    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        throw new Exception('Curl error: ' . curl_error($ch));
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    unset($ch);

    if ($httpCode !== 200) {
        throw new Exception("HTTP error! Status: {$httpCode}");
    }

    $result = json_decode($response, true);

    return $result['token'];
}
