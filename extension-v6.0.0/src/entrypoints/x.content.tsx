import '@/entrypoints/style.css'
import '@/entrypoints/x-style.content.css'

import type { ContentScriptContext } from 'wxt/client'

import ReactDOM from 'react-dom/client'

import { Status } from './content/Status'
import { Tone } from './content/Tone'

// Constants
const PATTERNS = {
  dialog: new MatchPattern('*://x.com/compose/*'),
  home: new MatchPattern('*://x.com/home'),
  status: new MatchPattern('*://x.com/*/status/*'),
} as const

const SELECTORS = {
  tweetComposer: '.css-175oi2r.r-kemksi.r-jumn1c.r-xd6kpl.r-gtdqiz.r-ipm5af.r-184en5c, .css-175oi2r.r-14lw9ot.r-jumn1c.r-xd6kpl.r-gtdqiz.r-ipm5af.r-184en5c, .css-175oi2r.r-yfoy6g.r-jumn1c.r-xd6kpl.r-gtdqiz.r-ipm5af.r-184en5c',
} as const

const COMPONENT_NAMES = {
  home: 'replier-status',
  tone: 'replier-tone',
} as const

// Utility functions
function getTheme(): 'dark' | 'light' {
  return document.documentElement.style.colorScheme === 'dark' ? 'dark' : 'light'
}

const logger = {
  debug: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(`[X Content Script] ${message}`, data)
    }
  },
  error: (message: string, error?: unknown) => {
    console.error(`[X Content Script] ${message}`, error)
  },
}

// Theme observer factory
function createThemeObserver(
  activeUi: Awaited<ReturnType<typeof createShadowRootUi>> | null,
) {
  let currentTheme = getTheme()

  const observer = new MutationObserver(() => {
    const newTheme = getTheme()
    if (newTheme !== currentTheme) {
      currentTheme = newTheme
      logger.debug('Theme changed', { from: currentTheme, to: newTheme })

      if (activeUi?.uiContainer) {
        activeUi.uiContainer.setAttribute('data-theme-type', newTheme)
      }
    }
  })

  observer.observe(document.documentElement, {
    attributeFilter: ['style'],
    attributes: true,
  })

  return {
    currentTheme: () => currentTheme,
    disconnect: () => observer.disconnect(),
  }
}

// UI component factory
async function createUIComponent(
  ctx: ContentScriptContext,
  options: {
    anchor: string
    componentName: string
    renderComponent: () => React.ReactElement
  },
) {
  const { anchor, componentName, renderComponent } = options

  try {
    // Check if component already exists
    const targetElement = document.querySelector(anchor)
    if (!targetElement) {
      logger.debug(`Target element not found for ${componentName}`)
      return null
    }

    if (targetElement.querySelector(componentName)) {
      logger.debug(`Component ${componentName} already exists`)
      return null
    }

    const currentTheme = getTheme()
    logger.debug(`Creating UI component ${componentName}`, { theme: currentTheme })

    const ui = await createShadowRootUi(ctx, {
      anchor,
      append: 'first',
      name: componentName,
      onMount: (container) => {
        container.classList.add('bg-transparent')
        container.setAttribute('data-theme-type', currentTheme)

        const wrapper = document.createElement('div')
        container.append(wrapper)

        const root = ReactDOM.createRoot(wrapper)
        root.render(renderComponent())

        logger.debug(`Component ${componentName} mounted successfully`)
        return { root, wrapper }
      },
      onRemove: (elements) => {
        elements?.root.unmount()
        elements?.wrapper.remove()
        logger.debug(`Component ${componentName} removed`)
      },
      position: 'inline',
    })

    ui.autoMount()
    return ui
  }
  catch (error) {
    logger.error(`Failed to create UI component ${componentName}`, error)
    return null
  }
}

// Debounced function utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default defineContentScript({
  cssInjectionMode: 'ui',

  async main(ctx) {
    logger.debug('X content script initializing')

    try {
      await injectScript('/x-parser.js', { keepInDom: true })
      logger.debug('X parser script injected successfully')
    }
    catch (error) {
      logger.error('Failed to inject X parser script', error)
    }

    let activeUi: Awaited<ReturnType<typeof createShadowRootUi>> | null = null
    const themeObserver = createThemeObserver(activeUi)

    // Debounced location change handler to prevent rapid re-renders
    const handleLocationChange = debounce(async (event: any) => {
      const newUrl = event.newUrl?.toString() || window.location.href
      logger.debug('Location changed', { url: newUrl })

      // Cleanup existing UI
      if (activeUi) {
        activeUi.remove()
        activeUi = null
      }

      try {
        // Handle status and dialog pages (reply functionality)
        if (PATTERNS.status.includes(newUrl) || PATTERNS.dialog.includes(newUrl)) {
          activeUi = await createUIComponent(ctx, {
            anchor: SELECTORS.tweetComposer,
            componentName: COMPONENT_NAMES.tone,
            renderComponent: () => <Tone source="x" />,
          })
        }

        // Handle home page (status creation)
        if (PATTERNS.home.includes(newUrl)) {
          activeUi = await createUIComponent(ctx, {
            anchor: SELECTORS.tweetComposer,
            componentName: COMPONENT_NAMES.home,
            renderComponent: () => <Status source="x" />,
          })
        }
      }
      catch (error) {
        logger.error('Error handling location change', error)
      }
    }, 300) // 300ms debounce

    // Set up location change listener
    ctx.addEventListener(window, 'wxt:locationchange', handleLocationChange)

    // Handle initial page load
    handleLocationChange({ newUrl: window.location.href })

    logger.debug('X content script initialized successfully')

    // Cleanup function
    return () => {
      logger.debug('X content script cleaning up')
      themeObserver.disconnect()
      if (activeUi) {
        activeUi.remove()
      }
    }
  },
  matches: ['*://x.com/*'],
})
