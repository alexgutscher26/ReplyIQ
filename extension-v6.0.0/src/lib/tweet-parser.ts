import type { PostData } from '@/schemas/post'

import type { ContentParser } from './content-parser'

import { BaseParser } from './base-parser'

interface UserInfo {
  handle: string
  username: string
}

interface VideoInfo {
  poster?: string
  url: string
}

export class TwitterParser extends BaseParser implements ContentParser {
  getContent(): null | PostData {
    try {
      const tweetContainer = document.querySelector('[data-testid="tweet"]')
      if (!tweetContainer)
        return null

      const parser = new DOMParser()
      const doc = parser.parseFromString(tweetContainer.outerHTML, 'text/html')

      // Extract main tweet content
      const text = doc.querySelector('[data-testid="tweetText"]')?.textContent?.trim() || ''
      const userInfo = extractUserInfo(doc.querySelector('[data-testid="User-Name"]'))
      const images = extractImages(doc.documentElement)
      const video = extractVideo(doc.documentElement)
      const url = getTweetUrl(doc)

      // Extract quoted tweet if exists
      const quotedTweet = extractQuotedTweet(doc.querySelector('[role="link"][tabindex="0"]'))

      return {
        ...userInfo,
        images,
        quotedPost: quotedTweet,
        text,
        url,
        video,
      }
    }
    catch (error) {
      console.error('Error parsing tweet content:', error)
      return null
    }
  }

  async setText(text: string): Promise<void> {
    try {
      const editor = document.querySelector('[data-testid="tweetTextarea_0RichTextInputContainer"] .public-DraftEditor-content') as HTMLElement
      if (!editor) {
        console.error('Tweet textarea not found')
        return
      }

      // Focus and ensure cursor is at the end
      editor.focus()
      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false) // collapse to end

      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }

      this.simulateTyping(editor, text)
    }
    catch (error) {
      console.error('Error setting tweet text:', error)
    }
  }
}

function extractImages(container: Element | null): string[] {
  if (!container)
    return []

  return Array.from(container.querySelectorAll('[data-testid="tweetPhoto"] img'))
    .map(img => img.getAttribute('src'))
    .filter((src): src is string => src !== null)
}

function extractQuotedTweet(container: Element | null) {
  if (!container)
    return undefined

  return {
    ...extractUserInfo(container),
    images: extractImages(container),
    text: container.querySelector('[data-testid="tweetText"]')?.textContent?.trim() || '',
    video: extractVideo(container),
  }
}

function extractUserInfo(container: Element | null): UserInfo {
  if (!container)
    return { handle: '', username: '' }

  const spans = Array.from(container.querySelectorAll('span'))
  const handleElement = spans.find(span => span.textContent?.trim().startsWith('@'))
  const usernameElement = spans.find((span) => {
    const text = span.textContent?.trim()
    return text && !text.startsWith('@') && text.length > 0
  })

  return {
    handle: handleElement?.textContent?.trim() || '',
    username: usernameElement?.textContent?.trim() || '',
  }
}

function extractVideo(container: Element | null): undefined | VideoInfo {
  const videoElement = container?.querySelector('video')
  if (!videoElement)
    return undefined

  const posterImg = videoElement.getAttribute('poster') || undefined
  const videoSource = videoElement.querySelector('source')
  const videoUrl = videoSource?.getAttribute('src') || videoElement.getAttribute('src')

  if (!videoUrl)
    return undefined

  return {
    poster: posterImg,
    url: videoUrl,
  }
}

function getTweetUrl(doc: Document): string {
  const timeElement = doc.querySelector('time')?.parentElement
  return timeElement?.getAttribute('href')
    ? `https://x.com${timeElement.getAttribute('href')}`
    : window.location.href
}
