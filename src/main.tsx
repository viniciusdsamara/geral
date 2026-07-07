import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErroBoundary from './components/ErroBoundary'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErroBoundary>
      <App />
    </ErroBoundary>
  </StrictMode>,
)
