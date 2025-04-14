
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker } from './utils/register-sw'

// Register service worker
registerServiceWorker().catch(console.error);

// Import Plyr custom styles
import 'plyr/dist/plyr.css';
import './styles/plyr-custom.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
