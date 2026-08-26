import { createRoot } from 'react-dom/client'
import { Root } from './Root'
import './ui.css'

// StrictMode is deliberately omitted: its double-invoked effects would build
// and tear down the WebGL context twice on every mount.
createRoot(document.getElementById('root')!).render(<Root />)
