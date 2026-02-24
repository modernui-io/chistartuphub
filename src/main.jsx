import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

const rootElement = document.getElementById('root');

// If the page was pre-rendered (SSG), hydrate to attach event handlers
// to the existing HTML instead of re-rendering from scratch.
// This gives instant FCP since content is already in the HTML.
if (rootElement.hasAttribute('data-prerendered')) {
  ReactDOM.hydrateRoot(rootElement, <App />);
} else {
  ReactDOM.createRoot(rootElement).render(<App />);
}

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}



