import { useCallback, useMemo, useState } from "react";
import debounce from "lodash/debounce";

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

function App() {
  const [enabled, setEnabled] = useState(
    window.__$paycoinly_settings?.enabled === "yes",
  );
  const [apiKey, setApiKey] = useState(window.__$paycoinly_settings?.api_key);

  const debounced = useMemo(
    () =>
      debounce((value: string) => {
        console.log(value);
      }, 500),
    [],
  );

  const handleApiKeyChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      setApiKey(e.target.value);
      debounced(e.target.value);
    }, []);

  return (
    <tbody>
      {wcSetting && (
        <tr vertical-align="top">
          <th scope="row" className="titledesc">
            <label htmlFor="enabled">Active</label>
          </th>
          <td className="forminp">
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
        <td className="forminp">
          <input
            className="input-text regular-input "
            type="text"
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
          <p className="description">Enter your Paycoinly API Key</p>
        </td>
      </tr>
    </tbody>
  );
}

export default App;
