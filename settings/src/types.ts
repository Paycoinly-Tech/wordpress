declare global {
  interface Window {
    __$paycoinly_settings: {
      enabled: string
      api_key: string
      payment_id: string
      wc_payment_id: string

      option_key?: string
      wc?: boolean
      server_url: string
    }
  }
}

export interface Payment {
  id: string
  name: string
  tokens: string[]
  type: boolean
  callbackUrl: string
}

export interface PaymentRaw {
  id: string
  name: string
  tokens: string[]
  type: string
  callbackUrl: string
}
