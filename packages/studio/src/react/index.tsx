/**
 * React Entry Point
 *
 * Initializes React application with HMR support
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Load FontAwesome CSS
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = '/css/fontawesome.min.css';
document.head.appendChild(fontAwesomeLink);

const elem = document.getElementById('root');

if (!elem) {
  throw new Error('Root element not found');
}

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, persist root across reloads
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // Production mode - create root normally
  createRoot(elem).render(app);
}
