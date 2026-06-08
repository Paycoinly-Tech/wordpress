;(function () {
  const settings = window.wc.wcSettings.getSetting('paycoinly_data', {})

  window.wc.wcBlocksRegistry.registerPaymentMethod({
    name: 'paycoinly',

    label: settings.title,

    content: window.wp.element.createElement(
      'div',
      null,
      'Pay in Crypto with Paycoinly'
    ),

    edit: window.wp.element.createElement(
      'div',
      null,
      'Pay in Crypto with Paycoinly'
    ),

    canMakePayment: () => true,

    ariaLabel: settings.title,

    supports: {
      features: ['products']
    }
  })
})()
