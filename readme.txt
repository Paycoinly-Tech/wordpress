=== Paycoinly ===
Contributors: donnferg
Donate link: https://www.paycoinly.xyz
Tags: crypto, cryptocurrency, payment, payment gateway
Requires at least: 4.6
Tested up to: 7.0
Stable tag: 1.0.0
License: GPLv3

== Description ==

## Overview

The official plugin maintained by [Paycoinly](https://www.paycoinly.xyz)

The plugin is designed to integrate crypto payment service powered by Paycoinly easily into your Wordpress or Woocommerce site without hassle of updating your code manually.

It provides [*paycoinly* shortcode](https://www.paycoinly.xyz/docs/appendix/wordpress-plugin-hooks#shortcodes) to place a button triggerring crypto payment service of Paycoinly, which can be used for subscription, credit system and the other pricing requirements of your site.
https://www.paycoinly.xyz/docs/integrations/wordpress

For Woocommerce sites, it adds Paycoinly crypto payment gateway in checkout page.
https://www.paycoinly.xyz/docs/integrations/woocommerce

It provides some actions and filters which customize its functionalities to meet your business demand and pricing requirements.
https://www.paycoinly.xyz/docs/appendix/wordpress-plugin-hooks

## Features

* 1% transaction fee
* Support Stablecoins, memecoins, native coins
* Support multichain
* Trigger payment from QR scan

## Use Cases

Subscription, Credit system, Woocommerce checkout

== Installation ==

* Navigate to Settings > Paycoinly
* Enter API Key
* Select a payment under *Payments* section

For Woocomerce sites

* Navigate to Woocommerce payment gateway settings
* Check *Activate Paycoinly Gateway in Woocommerce*
* Select a payment under *Payments* section

== Changelog ==

= 1.0.0 =

*Release Date - June 22 2026*
* Initial launch

== Frequently Asked Questions ==

= Do I have to provide API Key separately in plugin settings and Woocommerce payment gateway settings?

No, you don't have to. Configure API key once and it's shared in both settings.

= Why do I see the same looking settings in both plugin settings and Woocommerce payment gateway settings?

Though they look the same, they are actually different except *API Key* field.
The plugin settings apply to [*paycoinly* shortcode](https://www.paycoinly.xyz/docs/appendix/wordpress-plugin-hooks#shortcodes).
Woocommerce payment gateway settings applies to *Place order* button when Paycoinly is selected in checkout page .

== Screenshots ==
1. General settings
2. Woocommerce payment gateway settings
