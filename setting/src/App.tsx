import { useCallback, useMemo, useState, useTransition } from "react";
import debounce from "lodash/debounce";
import Spinner from "./Spinner";

declare global {
  interface Window {
    __$paycoinly_settings: {
      enabled: string;
      api_key: string;
      option_key?: string;
    };
  }
}

const wcSetting = !window.__$paycoinly_settings?.option_key;

// const PAYCOINLY_SERVER = 'https://ambx.vercel.app'
const PAYCOINLY_SERVER = "http://localhost:3000";

function App() {
  const [enabled, setEnabled] = useState(
    window.__$paycoinly_settings?.enabled === "yes",
  );
  const [apiKey, setApiKey] = useState(
    window.__$paycoinly_settings?.api_key ?? "",
  );

  const [isPending, makeRequest] = useTransition();

  const debounced = useMemo(
    () =>
      debounce((value: string) => {
        makeRequest(() =>
          fetch(`${PAYCOINLY_SERVER}/v1/payments`, {
            headers: {
              "x-api-key": value,
            },
          }).then((res) => res.json()),
        );
      }, 500),
    [],
  );

  const handleApiKeyChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      setApiKey(e.target.value);
      debounced(e.target.value);
    }, []);

  return (
    <tbody className="PaycoinlySetting">
      {wcSetting && (
        <tr vertical-align="top">
          <th scope="row" className="titledesc">
            <label htmlFor="enabled">Active</label>
          </th>
          <td>
            <label>
              <input
                type="checkbox"
                name="enabled"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Activate Paycoinly Gateway in Woocommerce
            </label>
          </td>
        </tr>
      )}
      {!wcSetting && (
        <input
          type="hidden"
          name={`${window.__$paycoinly_settings?.option_key}[enabled]`}
          checked={enabled}
        />
      )}
      <tr vertical-align="top">
        <th scope="row" className="titledesc">
          <label htmlFor="api_key">API Key</label>
        </th>
        <td>
          <div className="PaycoinlySetting__ApiKey">
            <input
              type="text"
              style={{ width: "100%" }}
              name={
                window.__$paycoinly_settings?.option_key
                  ? `${window.__$paycoinly_settings.option_key}[api_key]`
                  : "api_key"
              }
              id="api_key"
              placeholder=""
              value={apiKey}
              onChange={handleApiKeyChange}
            />
            <Spinner
              className={
                isPending
                  ? "PaycoinlySetting__ApiKey__Spinner--visible"
                  : "PaycoinlySetting__ApiKey__Spinner"
              }
            />
          </div>
          <p className="description">Enter your Paycoinly API Key</p>
        </td>
      </tr>
    </tbody>
  );
}

export default App;
