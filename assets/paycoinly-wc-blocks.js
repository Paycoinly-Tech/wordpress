const settings = window.wc.wcSettings.getSetting(
  'paycoinly_data',
  {}
);

const label = settings.title || 'Paycoinly';

window.wc.wcBlocksRegistry.registerPaymentMethod({
  name: 'paycoinly',

  label,

  content: wp.element.createElement(
    'div',
    null,
    'Crypto Payment Platform for Woocommerce'
  ),

  edit: wp.element.createElement(
    'div',
    null,
    'Crypto Payment Platform for Woocommerce'
  ),

  canMakePayment: () => true,

  ariaLabel: label,

  supports: {
      features: ['products']
  }
});
