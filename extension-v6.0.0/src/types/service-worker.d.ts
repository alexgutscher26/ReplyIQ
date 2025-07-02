/// <reference no-default-lib="true"/>
/// <reference lib="es2022" />
/// <reference lib="WebWorker" />

// This extends the default service worker global scope
declare const self: ServiceWorkerGlobalScope

export {}

// Extend the global scope with our custom types
declare global {
  interface ExtendableMessageEvent extends ExtendableEvent {
    data: null | Record<string, unknown>
    lastEventId: string
    origin: string
    ports: ReadonlyArray<MessagePort>
    source: Client | MessagePort | null | ServiceWorker
  }

  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: string[]
    addEventListener: {
      (
        type: 'message',
        listener: (event: ExtendableMessageEvent) => void,
        options?: AddEventListenerOptions | boolean
      ): void
      <K extends keyof ServiceWorkerGlobalScopeEventMap>(
        type: K,
        listener: (
          this: ServiceWorkerGlobalScope,
          ev: ServiceWorkerGlobalScopeEventMap[K]
        ) => unknown,
        options?: AddEventListenerOptions | boolean
      ): void
    }
    skipWaiting: () => Promise<void>
  }
}
