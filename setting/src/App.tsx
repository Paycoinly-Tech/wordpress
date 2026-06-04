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
  HStack,
  Box,
  Alert,
  Link
} from '@chakra-ui/react'

declare global {
  interface Window {
    __$paycoinly_settings: {
      enabled: string
      api_key: string
      option_key?: string
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

  return (
    <Fieldset.Root>
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
          <HStack w="full">
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
            <Box>
              <Spinner visibility={isPending ? 'visible' : 'hidden'} />
            </Box>
          </HStack>
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

        {apiKey !== '' && payments?.length === 0 && (
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
        {/* <th scope="row">
          <label>Payments</label>
        </th>
        <td>
          {payments.length === 0 ? (
            <div>
              No payments found. Please go to&nbsp;
              <a
                href={`${PAYCOINLY_SERVER}/payment/create-new`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Paycoinly dashboard
              </a>
              &nbsp; and add one.
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id}>{payment.name}</div>
            ))
          )}
        </td>
      </tr> */}
      </Fieldset.Content>
    </Fieldset.Root>
  )
}

export default App
