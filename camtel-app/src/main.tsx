import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext'
import { I18nProvider } from './context/I18nContext'
import { PwaInstallProvider } from './context/PwaInstallContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <PwaInstallProvider>
          <App />
        </PwaInstallProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
