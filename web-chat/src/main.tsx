import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="flex h-screen w-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Hello, World!</h1>
    </div>
  </StrictMode>,
)
