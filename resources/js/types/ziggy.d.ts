import type { Config, RouteParam, RouteParamsWithQueryOverload } from 'ziggy-js';

declare global {
  function route(): string;
  function route(
    name: string,
    params?: RouteParamsWithQueryOverload | RouteParam,
    absolute?: boolean,
    config?: Config,
  ): string;
}

export {};
