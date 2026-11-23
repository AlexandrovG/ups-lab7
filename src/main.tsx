import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import {Provider} from 'react-redux';
import {store} from './store';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode><Provider store={store}><App/></Provider></StrictMode>
);

// Production HTTPS and GitHub Pages only: installable offline PWA.
// Do not activate SW in Vite dev: it could otherwise cache stale scripts during development.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,
      {scope: import.meta.env.BASE_URL}).catch(err => console.warn('Service worker:',err));
  });
}
