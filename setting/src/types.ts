export interface Payment {
  id: string
  name: string
  tokens: string[]
  type: string
  callbackUrl: string
}

export enum CallbackType {
  Wordpress = 'Wordpress',
  Woocommerce = 'Woocommerce',
  Other = 'Other'
}
