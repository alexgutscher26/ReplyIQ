import '@/entrypoints/style.css'
import '@/entrypoints/x-style.content.css'
import ReactDOM from 'react-dom/client'

import { Status } from './content/Status'
import { Tone } from './content/Tone'

const statusPattern = new MatchPattern('*://x.com/*/status/*')
const dialogPattern = new MatchPattern('*://x.com/compose/*')
const TWEET_COMPOSER_SELECTOR = '.css-175oi2r.r-kemksi.r-jumn1c.r-xd6kpl.r-gtdqiz.r-ipm5af.r-184en5c, .css-175oi2r.r-14lw9ot.r-jumn1c.r-xd6kpl.r-gtdqiz.r-ipm5af.r-184en5c, .css-175oi2r.r-yfoy6g.r-jumn1c.r-xd6kpl.r-gtdqiz.r-ipm5af.r-184en5c'
const COMPONENT_NAME = 'replier-tone'

const homePattern = new MatchPattern('*://x.com/home')
const COMPONENT_HOME_NAME = 'replier-status'

export default defineContentScript({
  cssInjectionMode: 'ui',

  async main(ctx) {
    // Add theme detection function
    const getTheme = () => document.documentElement.style.colorScheme === 'dark' ? 'dark' : 'light'
    let currentTheme = getTheme()

    await injectScript('/x-parser.js', { keepInDom: true })

    let activeUi: Awaited<ReturnType<typeof createShadowRootUi>> | undefined

    // Add theme change observer
    const themeObserver = new MutationObserver(() => {
      const newTheme = getTheme()
      if (newTheme !== currentTheme) {
        currentTheme = newTheme
        if (activeUi) {
          const container = activeUi.uiContainer
          if (container) {
            container.setAttribute('data-theme-type', currentTheme)
          }
        }
      }
    })

    themeObserver.observe(document.documentElement, {
      attributeFilter: ['style'],
      attributes: true,
    })

    ctx.addEventListener(window, 'wxt:locationchange', async ({ newUrl }) => {
      // Cleanup existing UI if present
      if (activeUi) {
        activeUi.remove()
        activeUi = undefined
      }

      if (statusPattern.includes(newUrl) || dialogPattern.includes(newUrl)) {
        // Check if component already exists in the target element
        const targetElement = document.querySelector(TWEET_COMPOSER_SELECTOR)

        if (targetElement?.querySelector(COMPONENT_NAME))
          return

        const ui = await createShadowRootUi(ctx, {
          anchor: TWEET_COMPOSER_SELECTOR,
          append: 'first',
          name: COMPONENT_NAME,
          onMount: (container) => {
            container.classList.add('bg-transparent')
            container.setAttribute('data-theme-type', currentTheme) // Use current theme
            // Don't mount react app directly on <body>
            const wrapper = document.createElement('div')
            container.append(wrapper)

            const root = ReactDOM.createRoot(wrapper)
            root.render(<Tone source="x" />)
            return { root, wrapper }
          },
          onRemove: (elements) => {
            elements?.root.unmount()
            elements?.wrapper.remove()
          },
          position: 'inline',
        })
        ui.autoMount()
        activeUi = ui
      }

      if (homePattern.includes(newUrl)) {
        // Check if component already exists in the target element
        const targetElement = document.querySelector(TWEET_COMPOSER_SELECTOR)

        if (targetElement?.querySelector(COMPONENT_HOME_NAME))
          return

        const homeUi = await createShadowRootUi(ctx, {
          anchor: TWEET_COMPOSER_SELECTOR,
          append: 'first',
          name: COMPONENT_HOME_NAME,
          onMount: (container) => {
            container.classList.add('bg-transparent')
            container.setAttribute('data-theme-type', currentTheme) // Use current theme
            // Don't mount react app directly on <body>
            const wrapper = document.createElement('div')
            container.append(wrapper)

            const root = ReactDOM.createRoot(wrapper)
            root.render(<Status source="x" />)
            return { root, wrapper }
          },
          onRemove: (elements) => {
            elements?.root.unmount()
            elements?.wrapper.remove()
          },
          position: 'inline',
        })
        homeUi.autoMount()
        activeUi = homeUi
      }
    })

    // Update cleanup function
    return () => {
      themeObserver.disconnect()
      if (activeUi) {
        activeUi.remove()
      }
    }
  },
  matches: ['*://x.com/*'],
})
