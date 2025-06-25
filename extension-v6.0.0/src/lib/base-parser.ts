import type { PostData } from '@/schemas/post'

import type { ContentParser } from './content-parser'

export abstract class BaseParser implements ContentParser {
  abstract getContent(): null | PostData

  abstract setText(text: string): Promise<void>

  protected simulateTyping(editor: HTMLElement, text: string): void {
    editor.focus()
    let index = 0

    const typeNextChar = () => {
      if (index < text.length) {
        const char = text.charAt(index)
        document.execCommand('insertText', false, char)
        index++
        setTimeout(typeNextChar, 0.01)
      }
    }

    typeNextChar()
  }
}
