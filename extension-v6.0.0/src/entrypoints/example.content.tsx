import '@/entrypoints/style.css'
import { createTRPCProxyClient } from '@trpc/client'
import ReactDOM from 'react-dom/client'
import { chromeLink } from 'trpc-chrome/link'

import type { AppRouter } from './background'

// Simple test component
function ExampleComponent() {
  return (
    <div className="p-4 bg-blue-100 border border-blue-300 rounded">
      <p className="text-blue-800">
        This is an example React component in a content script.
      </p>
    </div>
  )
}

// Integrated - Vanilla
// More: https://wxt.dev/guide/content-script-ui.html
// If using Integrated - React, refer to the popup's trpc usage
export default defineContentScript({
  cssInjectionMode: 'ui',

  async main(ctx) {
    const port = chrome.runtime.connect()
    const trpc = createTRPCProxyClient<AppRouter>({
      links: [chromeLink({ port })],
    })

    const hello = await trpc.greeting.query({ name: 'content script' })
    // eslint-disable-next-line no-console
    console.log(hello)

    const ui = await createShadowRootUi(ctx, {
      anchor: 'body',
      append: 'first',
      name: 'wxt-react-example',
      onMount: (container) => {
        // Don't mount react app directly on <body>
        const wrapper = document.createElement('div')
        container.append(wrapper)

        const root = ReactDOM.createRoot(wrapper)
        root.render(<ExampleComponent />)
        return { root, wrapper }
      },
      onRemove: (elements) => {
        elements?.root.unmount()
        elements?.wrapper.remove()
      },
      position: 'inline',
    })
    ui.mount()

    const textUi = await createShadowRootUi(ctx, {
      anchor: 'body',
      append: 'last',
      name: 'wxt-react-example-text',
      onMount: (container) => {
        const text = document.createElement('div')
        text.textContent = 'Hello from content script!'
        container.append(text)
        return { text }
      },
      onRemove: (elements) => {
        elements?.text.remove()
      },
      position: 'inline',
    })
    textUi.mount()
  },
  matches: ['https://example.com/'],
})
