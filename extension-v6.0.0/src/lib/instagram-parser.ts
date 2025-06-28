import type { PostData } from '@/schemas/post'

import type { ContentParser } from './content-parser'

import { BaseParser } from './base-parser'

export class InstagramParser extends BaseParser implements ContentParser {
  private currentPostContainer: Element | null = null

  private readonly SELECTORS = {
    COMMENT_FORM: 'form[method="POST"]',
    COMMENT_INPUT: 'textarea[aria-label*="comment" i], textarea[placeholder*="comment" i]',
    DM_INPUT: 'div[contenteditable="true"][aria-label*="message" i], textarea[aria-label*="message" i]',
    EDITOR: '[contenteditable="true"], textarea',
    HANDLE: [
      'a[href*="/"] span',
      'a[role="link"] span',
      'header a span',
    ],
    IMAGE: [
      'article img[src*="instagram"]',
      'div[role="button"] img',
      'img[style*="object-fit"]',
    ],
    POST_CONTAINER: [
      'article',
      'div[role="dialog"]',
      'section:has(article)',
    ],
    TEXT: [
      'article span:not([aria-label])',
      'div[data-testid] span',
      'h1 span',
      'span[dir="auto"]',
    ],
    USERNAME: [
      'header h2',
      'header a span',
      'article header a span',
    ],
    VIDEO: {
      CONTAINER: 'article video, div[role="button"] video',
      PLAYER: 'video',
      POSTER: 'video + img, img[src*="instagram"]',
    },
  } as const

  getContent(element?: HTMLElement): null | PostData {
    try {
      const postContainer = this.setPostContainer(element)
      if (!postContainer)
        return null

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
      console.error('Error parsing Instagram content:', error)
      return null
    }
  }

  async setText(text: string, target?: Element): Promise<void> {
    try {
      const postContainer = this.setPostContainer(target as HTMLElement)
      if (!postContainer) {
        console.error('Instagram post container not found')
        return
      }

      // Try to find comment input first
      let editor = postContainer.querySelector(this.SELECTORS.COMMENT_INPUT) as HTMLElement

      // If not found, try DM input
      if (!editor) {
        editor = postContainer.querySelector(this.SELECTORS.DM_INPUT) as HTMLElement
      }

      // Fallback to any editor
      if (!editor) {
        editor = postContainer.querySelector(this.SELECTORS.EDITOR) as HTMLElement
      }

      if (!editor) {
        console.error('Instagram editor not found')
        return
      }

      if (editor.tagName === 'TEXTAREA') {
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
      console.error('Error setting Instagram text:', error)
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
      const linkElement = container.querySelector('a[href*="/"]')
      if (linkElement) {
        const href = linkElement.getAttribute('href')
        const match = href?.match(/\/([^/?]+)\/?/)
        if (match) {
          handle = `@${match[1]}`
        }
      }
    }

    return handle.startsWith('@') ? handle : `@${handle}`
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
    if (!videoElement)
      return undefined

    // Get video URL
    const videoUrl = videoElement instanceof HTMLVideoElement
      ? videoElement.src
      : videoElement.querySelector('video')?.src

    // Get poster image
    const posterElement = container.querySelector(this.SELECTORS.VIDEO.POSTER)
    const posterUrl = posterElement?.getAttribute('src') || undefined

    if (!videoUrl)
      return undefined

    return {
      poster: posterUrl,
      url: videoUrl,
    }
  }

  private isValidContentImage(img: HTMLImageElement): boolean {
    const src = img.src || ''

    // Filter out system images
    if (
      src.startsWith('data:image/svg+xml') // SVG icons
      || src.includes('sprite') // Instagram sprite images
      || src.includes('static') // Static assets
      || img.width < 50 // Small icons
      || img.height < 50 // Small icons
      || img.alt?.includes('emoji') // Emoji images
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
      // Try to find the current post container
      for (const selector of this.SELECTORS.POST_CONTAINER) {
        const container = document.querySelector(selector)
        if (container) {
          this.currentPostContainer = container
          return container
        }
      }
    }

    return this.currentPostContainer
  }
}
