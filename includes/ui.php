<?php

if (!defined('ABSPATH'))
    exit;

function paycoinly_spinner()
{
    $html = "<tr><td style='display: flex;'>";
    $html .= "<img src='" . plugin_dir_url(__FILE__) . "../assets/spinner.gif' alt='loading' style='width:4em; margin: auto' />";
    $html .= "</td></tr>";
    return $html;
}
