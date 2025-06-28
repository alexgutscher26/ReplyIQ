import type { PostData } from '@/schemas/post'

import type { ContentParser } from './content-parser'

import { BaseParser } from './base-parser'

export class YouTubeParser extends BaseParser implements ContentParser {
  private currentPostContainer: Element | null = null

  private readonly SELECTORS = {
    COMMENT_FORM: '#placeholder-area, .ytd-commentbox',
    COMMENT_INPUT:
      '#contenteditable-root[contenteditable="true"], #contenteditable-textarea[contenteditable="true"]',
    EDITOR: '[contenteditable="true"], textarea',
    HANDLE: ['#channel-name a', '#text a', '.ytd-channel-name a', '#author-text a'],
    IMAGE: ['#img', 'img[src*="ggpht"]', 'img[src*="ytimg"]', '.yt-img-shadow img'],
    POST_CONTAINER: [
      'ytd-comment-thread-renderer',
      'ytd-comment-renderer',
      'ytd-backstage-post-renderer',
      '#contents > ytd-comment-thread-renderer',
      '.ytd-comments',
    ],
    REPLY_INPUT:
      'div[contenteditable="true"][aria-label*="reply" i], div[contenteditable="true"][aria-label*="comment" i]',
    TEXT: [
      '#content-text',
      '#comment-content #content-text',
      '#content span',
      '.comment-text span',
      '#message #runs',
      '#runs',
    ],
    USERNAME: [
      '#author-text span',
      '#channel-name #text',
      '.ytd-channel-name #text',
      '#author-text #text',
    ],
    VIDEO: {
      CONTAINER: 'video, .html5-video-container video',
      PLAYER: 'video',
      POSTER: '.ytp-cued-thumbnail-overlay-image',
    },
  } as const

  getContent(element?: HTMLElement): null | PostData {
    try {
      const postContainer = this.setPostContainer(element)
      if (!postContainer) {
        return null
      }

      return {
        handle: this.extractHandle(postContainer),
        images: this.extractImages(postContainer),
        text: this.extractText(postContainer),
        url: window.location.href,
        username: this.extractUsername(postContainer),
        video: this.extractVideo(postContainer),
      }
    }
    catch (error) {
      console.error('Error parsing YouTube content:', error)
      return null
    }
  }

  async setText(text: string, target?: Element): Promise<void> {
    try {
      const postContainer = this.setPostContainer(target as HTMLElement)
      if (!postContainer) {
        console.error('YouTube post container not found')
        return
      }

      // Try to find comment input first
      let editor = postContainer.querySelector(this.SELECTORS.COMMENT_INPUT) as HTMLElement

      // If not found, try reply input
      if (!editor) {
        editor = postContainer.querySelector(this.SELECTORS.REPLY_INPUT) as HTMLElement
      }

      // Fallback to any contenteditable element
      if (!editor) {
        editor = postContainer.querySelector(this.SELECTORS.EDITOR) as HTMLElement
      }

      if (!editor) {
        console.error('YouTube editor not found')
        return
      }

      // YouTube uses contenteditable divs, not textareas
      if (editor.isContentEditable) {
        editor.focus()

        // Clear existing content
        editor.innerHTML = ''

        // Set the text content
        editor.textContent = text

        // Trigger input events
        const inputEvent = new Event('input', { bubbles: true })
        const changeEvent = new Event('change', { bubbles: true })
        editor.dispatchEvent(inputEvent)
        editor.dispatchEvent(changeEvent)

        // Also trigger any custom YouTube events
        const customEvent = new CustomEvent('yt-update-comments-header', { bubbles: true })
        editor.dispatchEvent(customEvent)
      }
      else if (editor.tagName === 'TEXTAREA') {
        const textarea = editor as HTMLTextAreaElement
        textarea.focus()
        textarea.value = text
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        textarea.dispatchEvent(new Event('change', { bubbles: true }))
      }
      else {
        this.simulateTyping(editor, text)
      }
    }
    catch (error) {
      console.error('Error setting YouTube text:', error)
    }
  }

  private extractElements<T extends Element>(
    container: Element,
    selectors: readonly string[] | string,
    multiple = false,
  ): T[] {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors]

    for (const selector of selectorArray) {
      const elements = Array.from(container.querySelectorAll<T>(selector))
      if (elements.length > 0) {
        return multiple ? elements : [elements[0]]
      }
    }
    return []
  }

  private extractHandle(container: Element): string {
    const [element] = this.extractElements(container, this.SELECTORS.HANDLE)
    let handle = element?.textContent?.trim() || ''

    // Extract handle from URL if available
    if (!handle) {
      const linkElement = container.querySelector(
        'a[href*="/channel/"], a[href*="/@"], a[href*="/c/"]',
      )
      if (linkElement) {
        const href = linkElement.getAttribute('href')
        if (href?.includes('/@')) {
          const match = href.match(/@([\w-]+)/)
          if (match) {
            handle = `@${match[1]}`
          }
        }
        else if (href?.includes('/channel/') || href?.includes('/c/')) {
          const match = href.match(/\/(?:channel|c)\/([\w-]+)/)
          if (match) {
            handle = match[1]
          }
        }
      }
    }

    return handle.startsWith('@') ? handle : handle ? `@${handle}` : ''
  }

  private extractImages(container: Element): string[] {
    return this.extractElements<HTMLImageElement>(container, this.SELECTORS.IMAGE, true)
      .filter(img => this.isValidContentImage(img))
      .map(img => img.src)
      .filter(Boolean)
  }

  private extractText(container: Element): string {
    const textElements = this.extractElements(container, this.SELECTORS.TEXT, true)
    return textElements
      .map(el => el?.textContent?.trim())
      .filter(text => text && text.length > 0)
      .join('\n')
      .trim()
  }

  private extractUsername(container: Element): string {
    const [element] = this.extractElements(container, this.SELECTORS.USERNAME)
    return element?.textContent?.trim() || ''
  }

  private extractVideo(container: Element) {
    const videoElement = container.querySelector(this.SELECTORS.VIDEO.CONTAINER)
    if (!videoElement) {
      return undefined
    }

    // Get video URL
    const videoUrl
      = videoElement instanceof HTMLVideoElement
        ? videoElement.src
        : videoElement.querySelector('video')?.src

    // Get poster/thumbnail image
    const posterElement = container.querySelector(this.SELECTORS.VIDEO.POSTER)
    const posterUrl = posterElement?.getAttribute('src') || undefined

    // For YouTube, we can also extract video ID from URL
    const currentUrl = window.location.href
    const videoIdMatch = currentUrl.match(/(?:v=|\/shorts\/|embed\/)([\w-]{11})/)
    const videoId = videoIdMatch ? videoIdMatch[1] : undefined

    const finalVideoUrl
      = videoUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined)

    if (!finalVideoUrl) {
      return undefined
    }

    return {
      poster: posterUrl,
      url: finalVideoUrl,
    }
  }

  private isValidContentImage(img: HTMLImageElement): boolean {
    const src = img.src || ''

    // Filter out system images
    if (
      src.startsWith('data:image/svg+xml') // SVG icons
      || src.includes('polymer') // YouTube polymer icons
      || src.includes('icons') // Icon images
      || img.width < 50 // Small icons
      || img.height < 50 // Small icons
      || img.alt?.includes('icon') // Icon alt text
      || src.includes('/s28-c-k-c0x00ffffff-no-rj') // Small profile pictures
    ) {
      return false
    }

    return true
  }

  private setPostContainer(element?: HTMLElement): Element | null {
    if (element) {
      const rootNode = element.getRootNode() as ShadowRoot
      const hostElement = rootNode.host

      for (const selector of this.SELECTORS.POST_CONTAINER) {
        const container = hostElement?.closest(selector)
        if (container) {
          this.currentPostContainer = container
          return container
        }
      }
    }

    if (!this.currentPostContainer) {
      // Try to find the current comment container
      for (const selector of this.SELECTORS.POST_CONTAINER) {
        const container = document.querySelector(selector)
        if (container) {
          this.currentPostContainer = container
          return container
        }
      }

      // Fallback to document body for YouTube
      this.currentPostContainer = document.body
    }

    return this.currentPostContainer
  }
}
