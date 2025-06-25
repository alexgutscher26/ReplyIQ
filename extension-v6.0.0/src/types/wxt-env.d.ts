/// <reference types="wxt" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

declare interface ImportMeta {
  readonly env: {
    readonly DEV: boolean
    readonly NODE_ENV: 'development' | 'production' | 'test'
    readonly PROD: boolean
    readonly SSR: boolean
    readonly WXT_SITE_URL: string
  }
}
