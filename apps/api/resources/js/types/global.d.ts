/// <reference types="vite/client" />

import type { RouteParams, RouteConfig } from './index';

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global route() function (injected by Ziggy via Inertia shared data)
declare function route(
  name?: string,
  params?: RouteParams,
  absolute?: boolean,
  config?: RouteConfig,
): string;

// Module declaration for ziggy-js so TypeScript recognizes `import { route } from 'ziggy-js'`
declare module 'ziggy-js' {
  export function route(
    name?: string,
    params?: RouteParams,
    absolute?: boolean,
    config?: RouteConfig,
  ): string;
  export default function route(
    name?: string,
    params?: RouteParams,
    absolute?: boolean,
    config?: RouteConfig,
  ): string;
}
