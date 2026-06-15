declare module 'tify' {
  // Minimal typing for the parts of Tify we use. The default export is the Tify
  // class; it auto-mounts when `container` is provided. See https://tify.rocks/
  export interface TifyOptions {
    container?: HTMLElement | string;
    manifestUrl?: string;
    [key: string]: unknown;
  }
  export default class Tify {
    constructor(options?: TifyOptions);
    mount(target: HTMLElement | string): void;
    destroy(): void;
  }
}

declare module 'tify/dist/tify.css';
