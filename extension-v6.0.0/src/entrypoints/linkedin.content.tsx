import '@/entrypoints/linkedin-style.content.css'
import '@/entrypoints/style.css'
import ReactDOM from 'react-dom/client'

import { Status } from './content/Status'
import { Tone } from './content/Tone'

export default defineContentScript({
  cssInjectionMode: 'ui',

  async main(ctx) {
    // Update dark theme detection
    const isDarkTheme = document.documentElement.classList.contains('theme--dark')

    let activeStatusUi: Awaited<ReturnType<typeof createShadowRootUi>> | null = null

    const createStatusUi = async () => {
      // Cleanup existing status UI if it exists
      if (activeStatusUi) {
        activeStatusUi.remove()
      }

      activeStatusUi = await createShadowRootUi(ctx, {
        anchor: '#artdeco-modal-outlet .share-creation-state__bottom .share-creation-state__promoted-detour-btn-container section',
        append: 'last',
        name: 'replier-status',
        onMount: (container) => {
          // Add theme attribute to the container
          container.classList.add('bg-transparent')
          container.setAttribute('data-theme-type', isDarkTheme ? 'dark' : 'light')
          const root = ReactDOM.createRoot(container)
          root.render(<Status source="linkedin" />)
          return { root }
        },
        onRemove: (elements) => {
          elements?.root.unmount()
        },
        position: 'inline',
      })
      activeStatusUi.autoMount()
    }

    await createStatusUi()

    const mountedUIs = new WeakMap<Element, Awaited<ReturnType<typeof createShadowRootUi>>>()

    const mountForForms = async () => {
      const forms = document.querySelectorAll('form.comments-comment-box__form')

      // Clean up removed forms
      for (const form of Array.from(forms)) {
        if (!document.contains(form)) {
          const ui = mountedUIs.get(form)
          if (ui) {
            ui.remove()
            mountedUIs.delete(form)
          }
        }
      }

      // Mount for new forms
      for (const form of Array.from(forms)) {
        if (!mountedUIs.has(form)) {
          const formId = `replier-form-${Date.now()}-${Math.random().toString(36).slice(2)}`
          form.setAttribute('data-replier-id', formId)

          const ui = await createShadowRootUi(ctx, {
            anchor: `[data-replier-id="${formId}"]`,
            append: 'last',
            name: 'replier-tone',
            onMount: (container) => {
              // Add theme attribute to the container
              container.classList.add('bg-transparent')
              container.setAttribute('data-theme-type', isDarkTheme ? 'dark' : 'light')
              const root = ReactDOM.createRoot(container)
              root.render(<Tone source="linkedin" />)
              return { root }
            },
            onRemove: (elements) => {
              elements?.root.unmount()
            },
            position: 'inline',
          })

          mountedUIs.set(form, ui)
          ui.autoMount()
        }
      }
    }

    const observer = new MutationObserver(() => {
      requestAnimationFrame(mountForForms)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Initial mount
    await mountForForms()

    return () => {
      observer.disconnect()
      if (activeStatusUi) {
        activeStatusUi.remove()
      }
    }
  },
  matches: ['*://*.linkedin.com/*'],
})
