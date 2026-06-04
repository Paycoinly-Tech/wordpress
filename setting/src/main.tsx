import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.scss'

createRoot(document.querySelector('.form-table')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
