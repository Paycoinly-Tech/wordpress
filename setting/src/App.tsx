import { useCallback, useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import type { Payment } from './types'
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
  Group
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

const pid = wcSetting ? defaultValues.wcPaymentId : defaultValues.paymentId

const PAYCOINLY_SERVER = 'https://ambx.vercel.app'
// const PAYCOINLY_SERVER = 'http://localhost:3000'

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
        disabled: !item.callbackUrl?.startsWith(
          `${window.location.origin}/wp-json/paycoinly/process-payment`
        )
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
    queryKey: ['payments', defaultValues.apiKey],
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
          setErrorFromSavedValue(
            'Selected payment is invalid. Please select a different one.'
          )
        } else if (res.some((item) => item.id === pid && item.disabled)) {
          setErrorFromSavedValue(
            `Selected payment is not eligible for your ${wcSetting ? 'store' : 'site'}. Please select a different one, or set the Wordpress option in Paycoinly dashboard.`
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
    queryKey: ['payments', debouncedApiKey],
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
                Your customers' payments won't be recorded in your site.
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

        {!wcSetting && (
          <input
            type="hidden"
            name={`${optionKey}[enabled]`}
            checked={enabled}
          />
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
                    cursor={item.disabled ? 'not-allowed' : 'initial'}
                    opacity={item.disabled ? 0.5 : 1}
                  >
                    <RadioCard.ItemHiddenInput
                      disabled={item.disabled}
                      name={
                        optionKey ? `${optionKey}[payment_id]` : 'wc_payment_id'
                      }
                    />
                    <RadioCard.ItemControl>
                      <RadioCard.ItemIndicator />
                      <RadioCard.ItemContent>
                        <RadioCard.ItemText>{item.name}</RadioCard.ItemText>
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
            {payments.some((item) => item.disabled) && (
              <Text>
                Some payments are disabled because they are not eligible for
                your {wcSetting ? 'store' : 'site'}. Please set the WordPress
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
