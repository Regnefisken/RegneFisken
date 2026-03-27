import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RootErrorBoundary } from './components/common/RootErrorBoundary.tsx'
import { bootstrapPersistence } from './logic/game-persistence'

bootstrapPersistence()

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <StrictMode>
      <App />
    </StrictMode>
  </RootErrorBoundary>,
)
