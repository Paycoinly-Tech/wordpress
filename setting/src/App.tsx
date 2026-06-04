import { useCallback, useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import { CallbackType, type Payment } from './types'
import { useQuery } from '@tanstack/react-query'
import {
  Spinner,
  Checkbox,
  Fieldset,
  Field,
  Input,
  Box,
  Alert,
  Link,
  Text,
  RadioCard,
  Group,
  Badge,
  HStack
} from '@chakra-ui/react'

declare global {
  interface Window {
    __$paycoinly_settings: {
      enabled: string
      api_key: string
      payment_id: string
      wc_payment_id: string

      option_key?: string
      wc?: boolean
    }
  }
}

const optionKey = window.__$paycoinly_settings?.option_key
const wcSetting = !optionKey

const defaultValues = {
  enabled: window.__$paycoinly_settings?.enabled === 'yes',
  apiKey: window.__$paycoinly_settings?.api_key ?? '',
  paymentId: window.__$paycoinly_settings?.payment_id ?? '',
  wcPaymentId: window.__$paycoinly_settings?.wc_payment_id ?? ''
}

const DESIRED_TYPE = wcSetting
  ? CallbackType.Woocommerce
  : CallbackType.Wordpress

const pid = wcSetting ? defaultValues.wcPaymentId : defaultValues.paymentId

const PAYCOINLY_SERVER = 'https://ambx.vercel.app'
// const PAYCOINLY_SERVER = 'http://localhost:3000'

const BASE_CALLBACK_URL = `${window.location.origin}/wp-json/paycoinly/process-payment`

const callbackType = (payment: Payment) => {
  if (payment.type !== 'Regular') {
    return CallbackType.Other
  }

  if (payment.callbackUrl === BASE_CALLBACK_URL + '/wc') {
    return CallbackType.Woocommerce
  }

  if (payment.callbackUrl === BASE_CALLBACK_URL) {
    return CallbackType.Wordpress
  }

  return CallbackType.Other
}

const fetchPayments = (apiKey: string) =>
  fetch(`${PAYCOINLY_SERVER}/v1/payments`, {
    headers: {
      'x-api-key': apiKey
    }
  })
    .then((res) => res.json())
    .then((res: Payment[]) =>
      res.map((item) => ({
        ...item,
        type: callbackType(item)
      }))
    )

interface PaycoinlyDashboardLinkProps {
  link: 'new' | 'dashboard'
}
const PaycoinlyDashboardLink: React.FC<PaycoinlyDashboardLinkProps> = ({
  link
}) => (
  <Link
    href={
      link === 'new'
        ? `${PAYCOINLY_SERVER}/payment/create-new`
        : `${PAYCOINLY_SERVER}/payment`
    }
    target="_blank"
    outline="none"
    color="orange"
  >
    Paycoinly dashboard
  </Link>
)

function App() {
  const [enabled, setEnabled] = useState(defaultValues.enabled)
  const [apiKey, setApiKey] = useState(defaultValues.apiKey)
  const [paymentId, setPaymentId] = useState<string>(pid)
  const [debouncedApiKey, setDebouncedApiKey] = useState(defaultValues.apiKey)

  const [errorFromSavedValue, setErrorFromSavedValue] =
    useState<React.ReactNode>(
      defaultValues.apiKey === '' ? 'API key is not provided.' : undefined
    )

  useQuery({
    refetchOnWindowFocus: false,
    enabled: !!defaultValues.apiKey,
    queryKey: ['payments', defaultValues.apiKey, wcSetting],
    queryFn: () =>
      fetchPayments(defaultValues.apiKey).then((res) => {
        if (res.length === 0) {
          setErrorFromSavedValue(
            <>
              No payments found for the provided API key. Please check your API
              key or add a new payment in <PaycoinlyDashboardLink link="new" />.
            </>
          )
        } else if (!res.some((item) => item.id === pid)) {
          setErrorFromSavedValue('No payment is selected. Please select one.')
        } else if (
          res.some((item) => item.id === pid && item.type !== DESIRED_TYPE)
        ) {
          setErrorFromSavedValue(
            <>
              Selected payment is not eligible for your
              {wcSetting ? 'store' : 'site'}. Please select a different one, or
              set the {wcSetting ? 'Woocommerce' : 'Wordpress'} option in{' '}
              <PaycoinlyDashboardLink link="dashboard" />.
            </>
          )
        }

        return res
      })
  })

  const {
    isPending,
    data: payments,
    error
  } = useQuery<Payment[]>({
    enabled: !!debouncedApiKey,
    refetchOnWindowFocus: false,
    queryKey: ['payments', debouncedApiKey, wcSetting],
    queryFn: () => fetchPayments(debouncedApiKey)
  })

  const debounced = useMemo(() => debounce(setDebouncedApiKey, 500), [])

  const handleApiKeyChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      setApiKey(e.target.value)
      debounced(e.target.value)
    }, [])

  return (
    <Fieldset.Root maxWidth="2xl">
      {errorFromSavedValue && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Warning, Immediate Action Required!</Alert.Title>
            <Alert.Description>
              <strong>
                Your customers' payments are't recorded properly in your site.
              </strong>
              <br />
              {errorFromSavedValue}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <Fieldset.Content>
        {wcSetting && (
          <Field.Root>
            <Checkbox.Root
              checked={enabled}
              onCheckedChange={(e) => setEnabled(!!e.checked)}
            >
              <Checkbox.HiddenInput name="enabled" />
              <Checkbox.Control />
              <Checkbox.Label>
                Activate Paycoinly Gateway in Woocommerce
              </Checkbox.Label>
            </Checkbox.Root>
          </Field.Root>
        )}

        {wcSetting ? (
          <>
            <input
              type="hidden"
              name={`${optionKey}[payment_id]`}
              value={defaultValues.paymentId}
            />
          </>
        ) : (
          <>
            <input
              type="hidden"
              name={`${optionKey}[enabled]`}
              checked={enabled}
            />
            <input
              type="hidden"
              name={`${optionKey}[wc_payment_id]`}
              value={defaultValues.wcPaymentId}
            />
          </>
        )}

        <Field.Root>
          <Field.Label>API Key</Field.Label>
          <Input
            name={optionKey ? `${optionKey}[api_key]` : 'api_key'}
            backgroundColor="white"
            value={apiKey}
            flexGrow="1"
            onChange={handleApiKeyChange}
          />
        </Field.Root>

        {apiKey === '' && (
          <Alert.Root status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>
                Please enter API key which you can see in{' '}
                <PaycoinlyDashboardLink link="dashboard" />
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {apiKey !== '' && !isPending && payments?.length === 0 && (
          <Alert.Root status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>No Payments Found</Alert.Title>
              <Alert.Description>
                There are no payments available. Please check if the provided
                API key is correct, or add a new payment in{' '}
                <PaycoinlyDashboardLink link="new" />.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {error && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Error</Alert.Title>
              <Alert.Description>{error.message}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {isPending && debouncedApiKey && (
          <Box display="flex">
            <Spinner m="auto" />
          </Box>
        )}

        {!error && payments && payments.length > 0 && (
          <Field.Root>
            <Field.Label>Payments</Field.Label>
            {wcSetting ? (
              <Text>Which payment are you going to use in checkout?</Text>
            ) : (
              <Text>Which payment are you going to use in your site?</Text>
            )}

            <RadioCard.Root
              defaultValue="next"
              gap="4"
              value={paymentId}
              backgroundColor="white"
              onValueChange={(e) => e.value && setPaymentId(e.value)}
            >
              <Group attached orientation="vertical">
                {payments.map((item) => (
                  <RadioCard.Item
                    key={item.id}
                    value={item.id}
                    width="full"
                    cursor={
                      item.type === DESIRED_TYPE ? 'initial' : 'not-allowed'
                    }
                    opacity={item.type === DESIRED_TYPE ? 1 : 0.5}
                  >
                    <RadioCard.ItemHiddenInput
                      disabled={item.type !== DESIRED_TYPE}
                      name={
                        optionKey ? `${optionKey}[payment_id]` : 'wc_payment_id'
                      }
                    />
                    <RadioCard.ItemControl>
                      <RadioCard.ItemIndicator />
                      <RadioCard.ItemContent>
                        <HStack w="full">
                          <RadioCard.ItemText>{item.name}</RadioCard.ItemText>
                          {item.type === CallbackType.Wordpress ? (
                            <Badge colorPalette="blue">Wordpress</Badge>
                          ) : (
                            item.type === CallbackType.Woocommerce && (
                              <Badge colorPalette="orange">Woocommerce</Badge>
                            )
                          )}
                        </HStack>
                        <RadioCard.ItemDescription>
                          {item.id}
                        </RadioCard.ItemDescription>
                      </RadioCard.ItemContent>
                    </RadioCard.ItemControl>
                  </RadioCard.Item>
                ))}
              </Group>
            </RadioCard.Root>
            {payments && !payments.find((item) => item.id === paymentId) && (
              <Alert.Root status="warning">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Warning!</Alert.Title>
                  <Alert.Description>
                    The payment is not selected and your customers' payments
                    won't be recorded in your site.
                    <br />
                    Please select one.
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}
            {payments.some((item) => item.type !== DESIRED_TYPE) && (
              <Text>
                Some payments are disabled because they are not eligible for
                your {wcSetting ? 'store' : 'site'}.
                <br />
                Please set the
                {wcSetting ? 'Woocommerce' : 'Wordpress'}
                option in the payment settings in{' '}
                <PaycoinlyDashboardLink link="dashboard" /> to use them.
              </Text>
            )}
          </Field.Root>
        )}

        {wcSetting ? (
          <Text>
            If you want to configure payment for pages other than Woocommerce
            checkout page, please go to{' '}
            <Link
              href={`${location.origin}/wp-admin/admin.php?page=paycoinly-settings`}
              outline="none"
              color="orange"
            >
              Paycoinly plugin setting
            </Link>{' '}
            page.
          </Text>
        ) : (
          window.__$paycoinly_settings?.wc && (
            <Text>
              WooCommerce is installed. If you want to configure payment for
              checkout page in your store, please go to{' '}
              <Link
                href={`${location.origin}/wp-admin/admin.php?page=wc-settings&tab=checkout&section=paycoinly`}
                outline="none"
                color="orange"
              >
                WooCommerce Paycoinly gateway setting
              </Link>{' '}
              page.
            </Text>
          )
        )}
      </Fieldset.Content>
    </Fieldset.Root>
  )
}

export default App
