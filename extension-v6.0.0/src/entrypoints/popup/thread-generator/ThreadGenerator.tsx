import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, MessageSquare } from 'lucide-react'
import { useState } from 'react'

interface ThreadResponse {
  platform: string
  thread: string[]
  tone: string
  topic: string
  totalPosts: number
}

export function ThreadGenerator() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<'linkedin' | 'twitter'>('twitter')
  const [tone, setTone] = useState<'casual' | 'engaging' | 'humorous' | 'informative' | 'professional'>('engaging')
  const [threadLength, setThreadLength] = useState(5)
  const [postLength, setPostLength] = useState<'long' | 'medium' | 'short' | 'x-pro'>('short')
  const [thread, setThread] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setThread([])

    try {
      const response = await fetch(`${import.meta.env.WXT_SITE_URL}/api/ai/threads`, {
        body: JSON.stringify({
          platform,
          postLength,
          threadLength,
          tone,
          topic,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data: unknown = await response.json()

      if (response.ok && typeof data === 'object' && data !== null && Array.isArray((data as ThreadResponse).thread)) {
        setThread((data as ThreadResponse).thread ?? [])
      }
      else {
        setError(
          typeof data === 'object' && data !== null && 'error' in data
            ? ((data as { error?: string }).error ?? 'Failed to generate thread')
            : 'Failed to generate thread',
        )
      }
    }
    catch {
      setError('Network error - please check your connection')
    }
    finally {
      setLoading(false)
    }
  }

  const openFullGenerator = () => {
    chrome.tabs.create({ url: `${import.meta.env.WXT_SITE_URL}/dashboard/thread-generator` })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <div>
            <CardTitle className="text-sm">Thread Generator</CardTitle>
            <CardDescription className="text-xs">
              Quick thread creation
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs font-medium" htmlFor="topic">
            Topic
          </Label>
          <textarea
            className="mt-1 text-xs resize-none w-full rounded-md border border-input bg-background px-3 py-2"
            disabled={loading}
            id="topic"
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTopic(e.target.value)}
            placeholder="What's your thread about?"
            rows={2}
            value={topic}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-medium" htmlFor="platform">
              Platform
            </Label>
            <select
              className="mt-1 h-8 text-xs w-full rounded-md border border-input bg-background px-3 py-1"
              disabled={loading}
              id="platform"
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlatform(e.target.value as typeof platform)}
              value={platform}
            >
              <option value="twitter">Twitter/X</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-medium" htmlFor="tone">
              Tone
            </Label>
            <select
              className="mt-1 h-8 text-xs w-full rounded-md border border-input bg-background px-3 py-1"
              disabled={loading}
              id="tone"
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTone(e.target.value as typeof tone)}
              value={tone}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="informative">Informative</option>
              <option value="engaging">Engaging</option>
              <option value="humorous">Humorous</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-medium" htmlFor="threadLength">
              Posts
            </Label>
            <input
              className="mt-1 h-8 text-xs w-full rounded-md border border-input bg-background px-3 py-1"
              disabled={loading}
              id="threadLength"
              max={15}
              min={2}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThreadLength(Number.parseInt(e.target.value) || 5)}
              type="number"
              value={threadLength}
            />
          </div>
          <div>
            <Label className="text-xs font-medium" htmlFor="postLength">
              Length
            </Label>
            <select
              className="mt-1 h-8 text-xs w-full rounded-md border border-input bg-background px-3 py-1"
              disabled={loading}
              id="postLength"
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPostLength(e.target.value as typeof postLength)}
              value={postLength}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
              <option value="x-pro">X Pro</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive bg-destructive/10 px-2 py-1 text-destructive text-xs">
            {error}
          </div>
        )}

        {thread.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Generated
              {' '}
              {thread.length}
              {' '}
              posts:
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {thread.slice(0, 3).map((post, index) => (
                <div className="bg-muted/50 rounded p-2 text-xs" key={index}>
                  <span className="font-medium text-primary">
                    {index + 1}
                    .
                  </span>
                  {' '}
                  <span className="whitespace-pre-line">
                    {post.substring(0, 80)}
                    {post.length > 80 ? '...' : ''}
                  </span>
                </div>
              ))}
              {thread.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +
                  {thread.length - 3}
                  {' '}
                  more posts...
                </div>
              )}
            </div>
            <Button
              className="w-full text-xs h-7"
              onClick={openFullGenerator}
              size="sm"
              variant="outline"
            >
              View Full Thread
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            className="flex-1 text-xs h-7"
            disabled={loading || topic.length < 3}
            onClick={handleGenerate}
            size="sm"
          >
            {loading
              ? (
                  <>
                    <Loader2 className="mr-1 size-3 animate-spin" />
                    Generating...
                  </>
                )
              : (
                  'Generate'
                )}
          </Button>
          <Button
            className="text-xs h-7"
            onClick={openFullGenerator}
            size="sm"
            variant="outline"
          >
            Full Tool
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
