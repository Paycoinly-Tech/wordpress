export interface Payment {
  id: string
  name: string
  tokens: string[]
  type: string
  callbackUrl: string
  disabled: boolean
}
