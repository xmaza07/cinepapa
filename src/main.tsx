
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker } from './utils/register-sw'
import { registerIframeProxySW } from './utils/iframe-proxy-sw'

// Register service workers
Promise.all([
  registerServiceWorker(),
  registerIframeProxySW()
]).catch(console.error);

// Import Plyr custom styles
import 'plyr/dist/plyr.css';
import './styles/plyr-custom.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
