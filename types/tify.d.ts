declare module 'tify' {
  // Minimal typing for the parts of Tify we use. The default export is the Tify
  // class; it auto-mounts when `container` is provided. See https://tify.rocks/
  export interface TifyOptions {
    container?: HTMLElement | string;
    manifestUrl?: string;
    /** Interface language; must match a translation filename. `en` needs no file. */
    language?: string;
    /** Language for IIIF manifest strings absent in `language` (else: first available). */
    fallbackLanguage?: string;
    /**
     * Where Tify fetches `${language}.json`, without a trailing slash. Always set this:
     * Tify's auto-detection reads `import.meta.url`, which webpack inlines to a
     * build-time `file://` path (tify/src/main.js).
     */
    translationsDirUrl?: string;
    [key: string]: unknown;
  }
  export default class Tify {
    constructor(options?: TifyOptions);
    mount(target: HTMLElement | string): void;
    destroy(): void;
    // Both are attached to the instance via `$api.expose()` in App.vue's created() hook.
    /** Swaps the interface language in place; resolves with the language actually applied. */
    setLanguage(language: string): Promise<string>;
    updateOptions(options: Partial<TifyOptions>): void;
  }
}

declare module 'tify/dist/tify.css';
