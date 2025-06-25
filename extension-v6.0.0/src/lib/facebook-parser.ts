import type { PostData } from '@/schemas/post'

import type { ContentParser } from './content-parser'

import { BaseParser } from './base-parser'

export class FacebookParser extends BaseParser implements ContentParser {
  private currentPostContainer: Element | null = null

  private readonly SELECTORS = {
    COMMENT_FORM: 'form.x1ed109x.x1n2onr6.xmjcpbm[role="presentation"]',
    EDITOR: '[contenteditable="true"]',
    HANDLE: [
      '.x193iq5w.xeuugli.x13faqbe.x1vvkbs span.x1heor9g',
      '.x193iq5w.xeuugli.x13faqbe.x1vvkbs.xlh3980.xvmahel.x1n0sxbx.x6prxxf.xvq8zen.xo1l8bm span',
    ],
    IMAGE: [
      'img.x1ey2m1c',
      'img.x1997x5c',
      '.x78zum5 img',
    ],
    POST_CONTAINER: [
      '.x1yztbdb',
      '[role="article"]',
      '.xh8yej3.x1n2onr6',
    ],
    TEXT: [
      // Background post selectors
      '[style*="background"] div[dir="auto"]',
      '[style*="color"] div[dir="auto"]',
      // Standard post selectors
      '.x1iorvi4 div[dir="auto"]',
      '.x1iorvi4 span[dir="auto"]',
      '[data-ad-preview="message"]',
      '.xdj266r div[dir="auto"]',
      '.x11i5rnm div[dir="auto"]',
    ],
    USERNAME: [
      '.x193iq5w.xeuugli strong span',
      '.x193iq5w.xeuugli a span',
    ],
    VIDEO: {
      CONTAINER: '.x1lliihq video, [data-video-id], [data-ad-preview="message"] video',
      PLAYER: 'video',
      POSTER: 'img[referrerpolicy="origin-when-cross-origin"]',
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
      console.error('Error parsing Facebook content:', error)
      return null
    }
  }

  async setText(text: string, target?: Element): Promise<void> {
    try {
      const postContainer = this.setPostContainer(target as HTMLElement)
      if (!postContainer) {
        console.error('Facebook post container not found')
        return
      }

      const editor = postContainer.querySelector(this.SELECTORS.EDITOR) as HTMLElement
      if (!editor) {
        console.error('Facebook comment editor not found')
        return
      }

      this.simulateTyping(editor, text)
    }
    catch (error) {
      console.error('Error setting Facebook text:', error)
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
    return element?.textContent?.trim() || ''
  }

  private extractImages(container: Element): string[] {
    return this.extractElements<HTMLImageElement>(container, this.SELECTORS.IMAGE, true)
      .filter(img => this.isValidContentImage(img))
      .map(img => img.src)
      .filter(Boolean)
  }

  private extractText(container: Element): string {
    // Try to find background formatted post first
    const backgroundPost = container.querySelector('[style*="background"]')
    if (backgroundPost) {
      const text = backgroundPost.textContent?.trim()
      if (text && text !== 'Facebook')
        return text
    }

    // Fall back to regular text extraction
    const textElements = this.extractElements(container, this.SELECTORS.TEXT, true)
    return textElements
      .map(el => el?.textContent?.trim())
      .filter(text => text && text !== 'Facebook')
      .join('\n')
      .trim()
  }

  private extractUsername(container: Element): string {
    const [element] = this.extractElements(container, this.SELECTORS.USERNAME)
    return element?.textContent?.trim() || ''
  }

  private extractVideo(container: Element) {
    // First try to find video directly
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
      || src.includes('emoji') // Emoji images
      || src.includes('static.xx.fbcdn.net') // Facebook UI assets
      || img.width < 50 // Small icons
      || img.height < 50 // Small icons
      || img.classList.contains('x16dsc37') // Reaction icons class
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
      const form = document.querySelector(this.SELECTORS.COMMENT_FORM)
      for (const selector of this.SELECTORS.POST_CONTAINER) {
        const container = form?.closest(selector)
        if (container) {
          this.currentPostContainer = container
          return container
        }
      }
    }

    return this.currentPostContainer
  }
}
