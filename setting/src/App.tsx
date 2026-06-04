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
  Listbox,
  createListCollection
} from '@chakra-ui/react'

declare global {
  interface Window {
    __$paycoinly_settings: {
      enabled: string
      api_key: string
      option_key?: string
      wc?: boolean
    }
  }
}

const wcSetting = !window.__$paycoinly_settings?.option_key

const PAYCOINLY_SERVER = 'https://ambx.vercel.app'
// const PAYCOINLY_SERVER = 'http://localhost:3000'

function App() {
  const [enabled, setEnabled] = useState(
    window.__$paycoinly_settings?.enabled === 'yes'
  )
  const [apiKey, setApiKey] = useState(
    window.__$paycoinly_settings?.api_key ?? ''
  )

  const [wcPayment, setWcPayment] = useState<string[]>([])

  const [debouncedApiKey, setDebouncedApiKey] = useState('')

  const {
    isPending,
    data: payments,
    error
  } = useQuery<Payment[]>({
    queryKey: ['payments', debouncedApiKey],
    queryFn: () =>
      fetch(`${PAYCOINLY_SERVER}/v1/payments`, {
        headers: {
          'x-api-key': debouncedApiKey
        }
      }).then((res) => res.json())
  })
  const debounced = useMemo(() => debounce(setDebouncedApiKey, 500), [])

  const handleApiKeyChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      setApiKey(e.target.value)
      debounced(e.target.value)
    }, [])

  const paymentCollection = useMemo(
    () =>
      createListCollection({
        items:
          payments?.map((p) => ({
            ...p,
            value: p.id,
            disabled: !p.callbackUrl?.startsWith(
              `${window.location.href}/process-payment`
            )
          })) ?? []
      }),
    [payments]
  )

  return (
    <Fieldset.Root maxWidth="2xl">
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
            name={`${window.__$paycoinly_settings?.option_key}[enabled]`}
            checked={enabled}
          />
        )}

        <Field.Root>
          <Field.Label>API Key</Field.Label>
          <Input
            name={
              window.__$paycoinly_settings?.option_key
                ? `${window.__$paycoinly_settings.option_key}[api_key]`
                : 'api_key'
            }
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
                Provide your API Key from{' '}
                <Link
                  href={`${PAYCOINLY_SERVER}/payment/create-new`}
                  target="_blank"
                  outline="none"
                  color="orange"
                >
                  Paycoinly dashboard
                </Link>
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
                There are no payments available. Please go to{' '}
                <Link
                  href={`${PAYCOINLY_SERVER}/payment/create-new`}
                  target="_blank"
                  outline="none"
                  color="orange"
                >
                  Paycoinly dashboard
                </Link>{' '}
                and add one.
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

        {isPending && (
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
            <Listbox.Root
              collection={paymentCollection}
              value={wcPayment}
              onValueChange={(details) => setWcPayment(details.value)}
            >
              <Listbox.Content>
                {paymentCollection.items.map((data) => (
                  <Listbox.Item item={data} key={data.id}>
                    <Box flex="1">
                      <Listbox.ItemText>{data.name}</Listbox.ItemText>
                      <Text fontSize="xs" mt="1" opacity={0.5}>
                        {data.id}
                      </Text>
                    </Box>
                    <Listbox.ItemIndicator />
                  </Listbox.Item>
                ))}
              </Listbox.Content>
            </Listbox.Root>
            {paymentCollection.items.some((item) => item.disabled) && (
              <Text>
                Some payments are disabled because they are not eligible for
                your {wcSetting ? 'store' : 'site'}. Please go to{' '}
                <Link
                  href={`${PAYCOINLY_SERVER}/payment`}
                  target="_blank"
                  outline="none"
                  color="orange"
                >
                  Paycoinly dashboard
                </Link>{' '}
                and set the WordPress option in the payment settings to use
                them.
              </Text>
            )}
          </Field.Root>
        )}

        {wcSetting ? (
          <Text>
            If you want to configure payment for pages other than Woocommerce checkout
            page, please go to{' '}
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
