import '@/entrypoints/instagram-style.content.css'
import '@/entrypoints/style.css'
import ReactDOM from 'react-dom/client'

import { Status } from './content/Status'
import { Tone } from './content/Tone'

export default defineContentScript({
  cssInjectionMode: 'ui',

  async main(ctx) {
    // Instagram uses system theme detection
    const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      || document.documentElement.classList.contains('dark')
      || document.body.classList.contains('dark')

    let activeStatusUi: Awaited<ReturnType<typeof createShadowRootUi>> | null = null

    const createStatusUi = async () => {
      // Cleanup existing status UI if it exists
      if (activeStatusUi) {
        activeStatusUi.remove()
      }

      // Mount on comment forms and DM interfaces
      const commentSelector = 'article form, section[role="dialog"] form, div[role="dialog"] form'

      activeStatusUi = await createShadowRootUi(ctx, {
        anchor: commentSelector,
        append: 'first',
        name: 'replier-status',
        onMount: (container) => {
          // Add theme attribute to the container
          container.classList.add('bg-transparent')
          container.setAttribute('data-theme-type', isDarkTheme ? 'dark' : 'light')
          const root = ReactDOM.createRoot(container)
          root.render(
            <Status source="instagram" />,
          )
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
      // Target comment forms, DM interfaces, and story reply areas
      const forms = document.querySelectorAll(`
        article form,
        section[role="dialog"] form,
        div[role="dialog"] form,
        div[role="textbox"][contenteditable="true"]
      `)

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
              root.render(
                <Tone source="instagram" />,
              )

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

    // Instagram uses React and frequently updates the DOM
    const observer = new MutationObserver(() => {
      requestAnimationFrame(mountForForms)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Listen for navigation changes (Instagram is a SPA)
    let lastUrl = location.href
    const urlObserver = new MutationObserver(() => {
      const currentUrl = location.href
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl
        setTimeout(() => {
          mountForForms()
        }, 1000) // Give Instagram time to load new content
      }
    })

    urlObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Initial mount
    await mountForForms()

    return () => {
      observer.disconnect()
      urlObserver.disconnect()
      if (activeStatusUi) {
        activeStatusUi.remove()
      }
    }
  },
  matches: ['*://*.instagram.com/*'],
})
