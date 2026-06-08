// import { useState, useRef, useEffect } from 'react'

const Pay = () => {
  // const {
  //   validate,
  //   onSubmit,
  //   disabled,
  //   isEditor,
  //   isPreview,
  //   eventRegistration: { onPaymentSetup },
  //   emitResponse
  // } = props

  // const [isShowingInternalPaymentSheet/*, setIsShowingInternalPaymentSheet*/] =
  //   useState(false)

  // const paymentResultRef = useRef(false)

  // const handleClick = async () => {
  //   // 1. Validate the checkout form
  //   const validationResult = await validate()

  //   if (validationResult.hasError) {
  //     return // WooCommerce automatically displays validation errors
  //   }

  //   // 2. Show your payment UI (e.g., Google Pay sheet, Apple Pay sheet)
  //   // setIsShowingInternalPaymentSheet( true );
  //   // const paymentResult = await showPaymentSheet( billing.cartTotal.value );
  //   // paymentResultRef.current = paymentResult.success;
  //   // if ( ! paymentResult.success ) {
  //   //     setIsShowingInternalPaymentSheet( false );
  //   //     return;
  //   // }

  //   // 3. Submit the checkout to the server once all payment information has been collected.
  //   onSubmit()
  // }

  // useEffect(
  //   () =>
  //     onPaymentSetup(() => {
  //       return {
  //         type: paymentResultRef.current
  //           ? emitResponse.responseTypes.SUCCESS
  //           : emitResponse.responseTypes.ERROR,
  //         meta: {
  //           paymentMethodData: {
  //             payment_method: 'your-payment-method'
  //           }
  //         }
  //       }
  //     }),
  //   [
  //     onPaymentSetup,
  //     emitResponse.responseTypes.SUCCESS,
  //     emitResponse.responseTypes.ERROR
  //   ]
  // )

  // // In editor/preview mode, show a placeholder or preview version
  // if (isEditor || isPreview) {
  //   return (
  //     <button type="button" disabled>
  //       Pay with Custom Method (Preview)
  //     </button>
  //   )
  // }

  return (
    <button
      type="button"
      className={
        [
          'wc-block-components-button',
          'wp-element-button',
          'wc-block-components-checkout-place-order-button',
          'wc-block-components-checkout-place-order-button--full-width',
          'contained'
        ].join(' ')
      }
      // onClick={handleClick}
      // disabled={disabled || isShowingInternalPaymentSheet}
    >
      {/* {disabled || isShowingInternalPaymentSheet ? (
        'Processing...'
      ) : ( */}
        <img
          src="https://app.paycoinly.xyz/logo/dark.svg"
          alt="Pay with Paycoinly"
        />
      {/* )} */}
    </button>
  )
}

export default Pay
