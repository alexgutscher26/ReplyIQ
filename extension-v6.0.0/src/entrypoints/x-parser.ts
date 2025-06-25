import { TwitterParser } from '@/lib/tweet-parser'

export default defineUnlistedScript(() => {
  console.warn('Hello offscreen')

  const parser = new TwitterParser()
  const content = parser.getContent()
  console.warn('Tweet content:', content)

  const htmlString = document.documentElement.innerHTML
  const scriptCount = scriptCounts(htmlString)
  console.warn(`Number of scripts: ${scriptCount}`)
})

function scriptCounts(htmlString: string) {
  const parser = new DOMParser()
  const document = parser.parseFromString(htmlString, 'text/html')

  const count = document.querySelectorAll('script').length

  return count
}
