import { TwitterParser } from '@/lib/tweet-parser'

export default defineUnlistedScript(() => {
  console.warn('Hello offscreen')

  const parser = new TwitterParser()
  const content = parser.getContent()
  console.warn('Tweet content:', content)

  try {
    const htmlString = document.documentElement.innerHTML
    const scriptCount = scriptCounts(htmlString)
    console.warn(`Number of scripts: ${scriptCount}`)
  }
  catch (error) {
    console.error('Error counting scripts:', error)
  }
})

function scriptCounts(htmlString: string): number {
  try {
    const parser = new DOMParser()
    const parsedDocument = parser.parseFromString(htmlString, 'text/html')

    const scriptElements = parsedDocument.querySelectorAll('script')
    const count = scriptElements.length

    // Ensure we always return a number
    return typeof count === 'number' && !Number.isNaN(count) ? count : 0
  }
  catch (error) {
    console.error('Error in scriptCounts function:', error)
    return 0
  }
}
