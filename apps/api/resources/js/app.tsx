import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { initCapacitor } from '@/lib/capacitor-init';
import { ToastProvider } from '@/Hooks/useToast';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';

// Initialize theme on page load
function initializeTheme() {
  const stored = localStorage.getItem('theme');
  const theme =
    stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Setup CSRF token for all axios requests
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
  axios.defaults.headers.common['X-CSRF-TOKEN'] = (token as HTMLMetaElement).content;
} else {
  console.error('CSRF token meta tag not found!');
}

// Ensure cookies are sent with requests
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

const appName = import.meta.env.VITE_APP_NAME || 'SIBERMAS';

// Initialize theme before rendering
initializeTheme();

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.tsx');
    return resolvePageComponent(`./Pages/${name}.tsx`, pages).then((module: any) => {
      const page = module.default;
      if (
        page.layout === undefined &&
        (name.startsWith('Admin/') || name.startsWith('Dpl/') || name.startsWith('Student/'))
      ) {
        page.layout = AppLayout.layout;
      }
      return module;
    });
  },
  setup({ el, App, props }) {
    initCapacitor();
    const root = createRoot(el);
    root.render(
      <ToastProvider>
        <App {...props} />
      </ToastProvider>,
    );
  },
  progress: {
    color: '#0B6B3A',
  },
});
