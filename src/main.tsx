import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

// A phone keeps the app open for days (above all from the home screen), so a new version would never load.
// Each time squared comes back to the front, it asks for the latest page; if its script has changed, it
// reloads — unless you're in the middle of writing.
if (import.meta.env.PROD) {
  const current = () => document.querySelector<HTMLScriptElement>('script[src*="/assets/index-"]')?.src
  const mine = current()
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || !mine) return
    try {
      const html = await (await fetch('/', { cache: 'no-store' })).text()
      const latest = html.match(/\/assets\/index-[\w-]+\.js/)?.[0]
      const typing = document.activeElement?.matches('textarea, input')
      if (latest && !mine.endsWith(latest) && !typing) location.reload()
    } catch {
      /* offline: keep what's here */
    }
  })
}
