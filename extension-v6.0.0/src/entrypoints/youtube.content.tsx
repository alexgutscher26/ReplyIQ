/* eslint-disable ts/no-use-before-define */
import '@/entrypoints/youtube-style.content.css'
import '@/entrypoints/style.css'
import ReactDOM from 'react-dom/client'

import { Tone } from './content/Tone'

// Debounce function for performance optimization
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

// Throttle function for high-frequency events
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export default defineContentScript({
  cssInjectionMode: 'ui',

  async main(ctx) {
    // Performance monitoring
    const perfStart = performance.now()

    // Optimized theme detection
    const getTheme = (): 'dark' | 'light' => {
      return document.documentElement.hasAttribute('dark')
        || document.documentElement.getAttribute('data-color-scheme') === 'dark'
        || document.body.classList.contains('dark-theme')
        ? 'dark'
        : 'light'
    }

    let currentTheme = getTheme()
    let isNavigating = false
    let lastUrl = location.href

    // Cache for mounted UIs to avoid re-creating
    const mountedUIs = new Map<Element, Awaited<ReturnType<typeof createShadowRootUi>>>()
    const processedElements = new Set<Element>()

    // Comprehensive selectors for all YouTube comment and reply forms
    const SELECTORS = {
      // All comment-related forms
      ALL_FORMS: [
        '#placeholder-area',
        'ytd-commentbox',
        'ytd-comment-simplebox-renderer',
        '#contenteditable-root[contenteditable="true"]',
        '[id*="comment"] [contenteditable="true"]',
        '[id*="reply"] [contenteditable="true"]',
      ],
      // Main comment forms
      COMMENT_FORMS: [
        '#placeholder-area:not([hidden])',
        'ytd-commentbox:not([hidden])',
        '#contenteditable-root[contenteditable="true"]',
      ],
      // Reply forms (more comprehensive)
      REPLY_FORMS: [
        'ytd-comment-replies #placeholder-area',
        'ytd-comment-thread-renderer #placeholder-area',
        'ytd-comment-replies ytd-commentbox',
        '#contenteditable-root[contenteditable="true"]',
        '[id*="reply"] #placeholder-area',
        '[id*="reply"] ytd-commentbox',
        'ytd-comment-simplebox-renderer',
      ],
    } as const

    // Initialize for current page
    const initializeForCurrentPage = async (): Promise<void> => {
      if (isNavigating) {
        return
      }

      try {
        await mountForForms()
      }
      catch (error) {
        console.error('YouTube AI Replier: Initialization error:', error)
      }
    }

    // Optimized form mounting with comprehensive selectors
    const mountForForms = async (): Promise<void> => {
      if (isNavigating) {
        return
      }

      try {
        // Use comprehensive selectors to catch all forms with better deduplication
        const formSet = new Set<Element>()

        // Collect all possible comment/reply forms using Set for automatic deduplication
        for (const selector of SELECTORS.ALL_FORMS) {
          const elements = Array.from(document.querySelectorAll(selector))
          for (const element of elements) {
            formSet.add(element)
          }
        }

        const allForms = Array.from(formSet)

        // Clean up removed forms efficiently
        const elementsToRemove: Element[] = []
        mountedUIs.forEach((ui, element) => {
          if (!document.contains(element)) {
            ui.remove()
            elementsToRemove.push(element)
          }
        })

        for (const element of elementsToRemove) {
          mountedUIs.delete(element)
          processedElements.delete(element)
        }

        // Process only new forms
        for (const form of allForms) {
          if (processedElements.has(form) || mountedUIs.has(form)) {
            continue
          }

          // Skip hidden or non-interactive elements
          if (form.hasAttribute('hidden')
            || form.getAttribute('aria-hidden') === 'true'
            || !form.isConnected) {
            continue
          }

          // Skip forms that already have our component
          if (form.hasAttribute('data-replier-id') || form.querySelector('[data-replier-id]')) {
            continue
          }

          processedElements.add(form)

          const formId = `replier-form-${Date.now()}-${Math.random().toString(36).slice(2)}`
          form.setAttribute('data-replier-id', formId)

          try {
            const ui = await createShadowRootUi(ctx, {
              anchor: `[data-replier-id="${formId}"]`,
              append: 'last',
              name: 'replier-tone',
              onMount: (container) => {
                container.classList.add('bg-transparent')
                container.setAttribute('data-theme-type', currentTheme)
                const root = ReactDOM.createRoot(container)
                root.render(<Tone source="youtube" />)
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
          catch (error) {
            console.error('YouTube AI Replier: Failed to mount form UI:', error)
            processedElements.delete(form)
          }
        }
      }
      catch (error) {
        console.error('YouTube AI Replier: Error in mountForForms:', error)
      }
    }

    // Reduced debounce time for faster response to reply forms
    const debouncedMountForForms = debounce(mountForForms, 150)

    // Optimized navigation detection
    const handleNavigation = (): void => {
      const currentUrl = location.href
      if (currentUrl !== lastUrl) {
        isNavigating = true
        lastUrl = currentUrl

        // Reset processed elements for new page
        processedElements.clear()

        // Re-initialize after navigation with delay
        setTimeout(() => {
          isNavigating = false
          initializeForCurrentPage()
        }, 600) // Reduced delay for better responsiveness
      }
    }

    // Optimized theme observer with throttling
    const handleThemeChange = throttle((): void => {
      const newTheme = getTheme()
      if (newTheme !== currentTheme) {
        currentTheme = newTheme

        // Update all mounted UIs with new theme
        document.querySelectorAll('[data-replier-id]').forEach((element) => {
          element.setAttribute('data-theme-type', currentTheme)
        })
      }
    }, 500)

    // Enhanced MutationObserver with better detection
    const observer = new MutationObserver(throttle((mutations) => {
      let shouldUpdate = false
      let shouldCheckNavigation = false

      for (const mutation of mutations) {
        // Check for navigation changes
        if (mutation.type === 'childList' && mutation.target === document.body) {
          shouldCheckNavigation = true
        }

        // Check for relevant content changes with better detection
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element

              // Check if added node contains any comment/reply forms
              const hasCommentForm = SELECTORS.ALL_FORMS.some(selector =>
                element.matches?.(selector) || element.querySelector?.(selector),
              )

              // Also check for reply buttons being clicked (new reply forms)
              const hasReplyElements = element.matches?.('ytd-comment-replies, ytd-comment-thread-renderer')
                || element.querySelector?.('ytd-comment-replies, ytd-comment-thread-renderer')
                || element.id?.includes('reply')
                || element.className?.includes('reply')

              if (hasCommentForm || hasReplyElements) {
                shouldUpdate = true
                break
              }
            }
          }
        }

        // Check for attribute changes that might indicate new forms
        if (mutation.type === 'attributes') {
          const target = mutation.target as Element

          // Theme changes
          if (mutation.attributeName === 'dark'
            || mutation.attributeName === 'data-color-scheme'
            || mutation.attributeName === 'class') {
            handleThemeChange()
          }

          // Check for forms becoming visible
          if (mutation.attributeName === 'hidden'
            || mutation.attributeName === 'aria-hidden'
            || mutation.attributeName === 'style') {
            const isCommentForm = SELECTORS.ALL_FORMS.some(selector => target.matches?.(selector))
            if (isCommentForm) {
              shouldUpdate = true
            }
          }
        }
      }

      if (shouldCheckNavigation) {
        handleNavigation()
      }
      else if (shouldUpdate && !isNavigating) {
        debouncedMountForForms()
      }
    }, 100)) // Reduced throttle for faster response

    // Start observing with optimized configuration
    observer.observe(document.body, {
      attributeFilter: ['hidden', 'aria-hidden', 'style', 'dark', 'data-color-scheme', 'class'],
      attributeOldValue: false,
      attributes: true,
      childList: true,
      subtree: true,
    })

    // Theme observer for documentElement
    const themeObserver = new MutationObserver(handleThemeChange)
    themeObserver.observe(document.documentElement, {
      attributeFilter: ['dark', 'data-color-scheme'],
      attributes: true,
    })

    // Click listener for reply buttons to ensure immediate mounting
    document.addEventListener('click', (event) => {
      const target = event.target as Element

      // Check if a reply button was clicked
      if (target.closest('[aria-label*="Reply"], [title*="Reply"], button[id*="reply"]')) {
        // Wait a bit for the form to appear, then mount
        setTimeout(() => {
          if (!isNavigating) {
            mountForForms()
          }
        }, 200)
      }
    }, { passive: true })

    // Initial setup with performance tracking
    await initializeForCurrentPage()

    const perfEnd = performance.now()
    console.warn(`YouTube AI Replier: Initialized in ${perfEnd - perfStart}ms`)

    // Cleanup function
    return () => {
      observer.disconnect()
      themeObserver.disconnect()

      // Clean up all mounted UIs
      mountedUIs.forEach((ui) => {
        ui.remove()
      })

      mountedUIs.clear()
      processedElements.clear()
    }
  },
  matches: ['*://*.youtube.com/*'],
})
