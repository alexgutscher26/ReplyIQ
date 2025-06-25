import type { PostData } from '@/schemas/post'

import type { ContentParser } from './content-parser'

import { BaseParser } from './base-parser'

export class LinkedInParser extends BaseParser implements ContentParser {
  private currentPostContainer: Element | null = null

  private readonly SELECTORS = {
    COMMENT_FORM: 'form.comments-comment-box__form',
    EDITOR: '.ql-editor[contenteditable="true"]',
    HANDLE: '.update-components-actor__description', // Keeping this for the headline
    IMAGE: '.update-components-image__image',
    POST_CONTAINER: '.feed-shared-update-v2',
    STATUS_CONTAINER: '#artdeco-modal-outlet',
    TEXT: '.update-components-text',
    USERNAME: '.update-components-actor__title span[dir="ltr"]',
    VIDEO: {
      CONTAINER: '.update-components-linkedin-video',
      PLAYER: '.vjs-tech',
      POSTER: '.vjs-poster-background',
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
      console.error('Error parsing LinkedIn content:', error)
      return null
    }
  }

  async setText(text: string, target?: Element): Promise<void> {
    try {
      const postContainer = this.setPostContainer(target as HTMLElement)
      if (!postContainer) {
        console.error('LinkedIn post container not found')
        return
      }

      const editor = postContainer.querySelector(this.SELECTORS.EDITOR) as HTMLElement
      if (!editor) {
        console.error('LinkedIn comment editor not found')
        return
      }

      this.simulateTyping(editor, text)
    }
    catch (error) {
      console.error('Error setting LinkedIn text:', error)
    }
  }

  private extractHandle(container: Element): string {
    const headlineElement = container.querySelector(this.SELECTORS.HANDLE)
    return headlineElement?.textContent?.trim() || ''
  }

  private extractImages(container: Element): string[] {
    return Array.from(container.querySelectorAll(this.SELECTORS.IMAGE))
      .map(img => img.getAttribute('src'))
      .filter((src): src is string => src !== null)
  }

  private extractText(container: Element): string {
    const textElement = container.querySelector(this.SELECTORS.TEXT)
    return textElement?.textContent?.trim() || ''
  }

  private extractUsername(container: Element): string {
    const nameElement = container.querySelector(this.SELECTORS.USERNAME)
    // Get just the visible text content and clean up any extra whitespace
    return nameElement?.querySelector('span[aria-hidden="true"]')?.textContent?.trim() || ''
  }

  private extractVideo(container: Element) {
    const videoContainer = container.querySelector(this.SELECTORS.VIDEO.CONTAINER)
    if (!videoContainer)
      return undefined

    const videoElement = videoContainer.querySelector(this.SELECTORS.VIDEO.PLAYER)
    const posterElement = videoContainer.querySelector(this.SELECTORS.VIDEO.POSTER)

    // Extract video source
    const videoUrl = videoElement?.getAttribute('src')

    // Extract poster URL from background-image style
    const posterStyle = posterElement?.getAttribute('style')
    const posterUrl = posterStyle?.match(/url\("([^"]+)"\)/)?.[1]

    if (!videoUrl)
      return undefined

    return {
      poster: posterUrl,
      url: videoUrl,
    }
  }

  private setPostContainer(element?: HTMLElement): Element | null {
    if (element) {
      const rootNode = element.getRootNode() as ShadowRoot
      const hostElement = rootNode.host

      // Try to find either post container or status container
      this.currentPostContainer
        = hostElement?.closest(this.SELECTORS.POST_CONTAINER)
          || hostElement?.closest(this.SELECTORS.STATUS_CONTAINER)
          || null
    }
    else if (!this.currentPostContainer) {
      // For cases without element, try to find either container type
      const form = document.querySelector(this.SELECTORS.COMMENT_FORM)
      this.currentPostContainer
        = form?.closest(this.SELECTORS.POST_CONTAINER)
          || form?.closest(this.SELECTORS.STATUS_CONTAINER)
          || null
    }

    return this.currentPostContainer
  }
}
