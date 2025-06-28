import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  Copy,
  ExternalLink,
  Eye,
  Instagram,
  Lightbulb,
  Linkedin,
  Loader2,
  MessageSquare,
  Save,
  Sparkles,
  TrendingUp,
  Twitter,
  Youtube,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface ThreadResponse {
  platform: string
  thread: string[]
  tone: string
  topic: string
  totalPosts: number
}

interface ThreadTemplate {
  description: string
  icon: React.ReactNode
  id: string
  name: string
  platform: 'instagram' | 'linkedin' | 'twitter' | 'youtube'
  postLength: 'long' | 'medium' | 'short' | 'x-pro'
  threadLength: number
  tone: 'casual' | 'engaging' | 'humorous' | 'informative' | 'professional'
  topic: string
}

const THREAD_TEMPLATES: ThreadTemplate[] = [
  {
    description: '5 essential startup lessons',
    icon: <TrendingUp className="h-3 w-3" />,
    id: 'startup-tips',
    name: 'Startup Tips',
    platform: 'twitter',
    postLength: 'short',
    threadLength: 6,
    tone: 'professional',
    topic: '5 key lessons I learned building my startup',
  },
  {
    description: 'Professional industry analysis',
    icon: <Lightbulb className="h-3 w-3" />,
    id: 'industry-insights',
    name: 'Industry Insights',
    platform: 'linkedin',
    postLength: 'medium',
    threadLength: 8,
    tone: 'informative',
    topic: 'The future of AI in our industry: what to expect',
  },
  {
    description: 'Step-by-step tutorial',
    icon: <BookOpen className="h-3 w-3" />,
    id: 'how-to-guide',
    name: 'How-To Guide',
    platform: 'linkedin',
    postLength: 'medium',
    threadLength: 7,
    tone: 'professional',
    topic: 'How to optimize your LinkedIn profile for maximum visibility',
  },
  {
    description: 'Engaging personal narrative',
    icon: <Sparkles className="h-3 w-3" />,
    id: 'engaging-story',
    name: 'Personal Story',
    platform: 'twitter',
    postLength: 'short',
    threadLength: 5,
    tone: 'engaging',
    topic: 'The moment that changed my career perspective',
  },
  {
    description: 'Visual storytelling with hooks',
    icon: <Instagram className="h-3 w-3" />,
    id: 'instagram-story',
    name: 'Instagram Story',
    platform: 'instagram',
    postLength: 'medium',
    threadLength: 6,
    tone: 'engaging',
    topic: 'Behind the scenes of my creative process',
  },
  {
    description: 'Video content outline',
    icon: <Youtube className="h-3 w-3" />,
    id: 'youtube-content',
    name: 'YouTube Content',
    platform: 'youtube',
    postLength: 'long',
    threadLength: 4,
    tone: 'informative',
    topic: 'Creating engaging video content that converts viewers',
  },
]

const PLATFORM_LIMITS = {
  instagram: { 'long': 2200, 'medium': 1500, 'short': 1000, 'x-pro': 2200 },
  linkedin: { 'long': 3000, 'medium': 2000, 'short': 1300, 'x-pro': 3000 },
  twitter: { 'long': 280, 'medium': 280, 'short': 280, 'x-pro': 25000 },
  youtube: { 'long': 5000, 'medium': 3000, 'short': 2000, 'x-pro': 5000 },
}

export function ThreadGenerator() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<'instagram' | 'linkedin' | 'twitter' | 'youtube'>('twitter')
  const [tone, setTone] = useState<'casual' | 'engaging' | 'humorous' | 'informative' | 'professional'>('engaging')
  const [threadLength, setThreadLength] = useState(5)
  const [postLength, setPostLength] = useState<'long' | 'medium' | 'short' | 'x-pro'>('short')
  const [thread, setThread] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [copied, setCopied] = useState<null | number>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [savedDrafts, setSavedDrafts] = useState<any[]>([])
  const [previewMode, setPreviewMode] = useState(false)

  // Load saved drafts on component mount
  useEffect(() => {
    const drafts = localStorage.getItem('thread-generator-drafts')
    if (drafts) {
      try {
        setSavedDrafts(JSON.parse(drafts))
      }
      catch {
        setSavedDrafts([])
      }
    }
  }, [])

  // Auto-save current state as draft
  useEffect(() => {
    if (topic.length > 5) {
      const currentDraft = {
        id: Date.now(),
        platform,
        postLength,
        preview: topic.substring(0, 50) + (topic.length > 50 ? '...' : ''),
        threadLength,
        timestamp: new Date().toISOString(),
        tone,
        topic,
      }

      const drafts = savedDrafts.filter(d => d.topic !== topic).slice(0, 4) // Keep last 5 drafts
      const newDrafts = [currentDraft, ...drafts]
      setSavedDrafts(newDrafts)
      localStorage.setItem('thread-generator-drafts', JSON.stringify(newDrafts))
    }
  }, [topic, platform, tone, threadLength, postLength, savedDrafts])

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
    const baseUrl = import.meta.env.WXT_SITE_URL.endsWith('/')
      ? import.meta.env.WXT_SITE_URL.slice(0, -1)
      : import.meta.env.WXT_SITE_URL
    let url = `${baseUrl}/dashboard/thread-generator`

    // If we have thread data, encode it in URL parameters
    if (thread.length > 0 || topic.length > 0) {
      const params = new URLSearchParams()
      params.set('from', 'extension')

      if (topic)
        params.set('topic', topic)
      if (platform)
        params.set('platform', platform)
      if (tone)
        params.set('tone', tone)
      if (threadLength)
        params.set('threadLength', threadLength.toString())
      if (postLength)
        params.set('postLength', postLength)

      // For thread data, we'll encode it as base64 to handle special characters
      if (thread.length > 0) {
        try {
          const threadData = JSON.stringify(thread)
          const encodedThread = btoa(unescape(encodeURIComponent(threadData)))
          params.set('thread', encodedThread)
        }
        catch (error) {
          console.error('Failed to encode thread data:', error)
        }
      }

      url += `?${params.toString()}`
    }

    chrome.tabs.create({ url })
  }

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(index ?? -1)
      setTimeout(() => setCopied(null), 2000)
    }
    catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(index ?? -1)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const copyEntireThread = () => {
    const threadText = thread.map((post, index) => `${index + 1}. ${post}`).join('\n\n')
    copyToClipboard(threadText, -1)
  }

  const applyTemplate = (template: ThreadTemplate) => {
    setTopic(template.topic)
    setPlatform(template.platform)
    setTone(template.tone)
    setThreadLength(template.threadLength)
    setPostLength(template.postLength)
    setShowTemplates(false)
  }

  const loadDraft = (draft: any) => {
    setTopic(draft.topic)
    setPlatform(draft.platform)
    setTone(draft.tone)
    setThreadLength(draft.threadLength)
    setPostLength(draft.postLength)
  }

  const getCharacterLimit = () => {
    return PLATFORM_LIMITS[platform][postLength]
  }

  const isTopicValid = topic.length >= 3
  const topicTooLong = topic.length > 200

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-sm">Thread Generator</CardTitle>
              <CardDescription className="text-xs">
                AI-powered thread creation
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              className="h-6 w-6 p-0"
              onClick={() => setShowTemplates(!showTemplates)}
              size="sm"
              title="Templates"
              variant="ghost"
            >
              <Sparkles className="h-3 w-3" />
            </Button>
            <Button
              className="h-6 w-6 p-0"
              onClick={() => setPreviewMode(!previewMode)}
              size="sm"
              title="Preview Mode"
              variant="ghost"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Templates Section */}
        {showTemplates && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">✨ Quick Templates</div>
            <div className="grid grid-cols-1 gap-2">
              {THREAD_TEMPLATES.map(template => (
                <Button
                  className="h-auto p-3 text-left flex items-start gap-2"
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  size="sm"
                  variant="outline"
                >
                  {template.icon}
                  <div className="flex-1">
                    <div className="text-xs font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </div>
                </Button>
              ))}
            </div>
            <div className="border-t pt-2"></div>
          </div>
        )}

        {/* Recent Drafts */}
        {savedDrafts.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">💾 Recent Drafts</div>
            <div className="space-y-1">
              {savedDrafts.slice(0, 2).map(draft => (
                <Button
                  className="h-auto p-2 text-left w-full justify-start"
                  key={draft.id}
                  onClick={() => loadDraft(draft)}
                  size="sm"
                  variant="ghost"
                >
                  <div className="flex items-center gap-2">
                    <Save className="h-3 w-3" />
                    <div className="text-xs truncate">{draft.preview}</div>
                  </div>
                </Button>
              ))}
            </div>
            <div className="border-t pt-2"></div>
          </div>
        )}

        {/* Topic Input */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium" htmlFor="topic">
              Topic
            </Label>
            <div className="text-xs text-muted-foreground">
              {topic.length}
              /200
            </div>
          </div>
          <textarea
            className={`mt-1 text-xs resize-none w-full rounded-md border px-3 py-2 ${
              topicTooLong
                ? 'border-red-500 bg-red-50 dark:bg-red-950'
                : isTopicValid
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : 'border-input bg-background'
            }`}
            disabled={loading}
            id="topic"
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTopic(e.target.value)}
            placeholder="What's your thread about? Be specific and engaging..."
            rows={2}
            value={topic}
          />
          {topicTooLong && (
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              Topic too long
            </div>
          )}
        </div>

        {/* Platform and Tone */}
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
              <option value="twitter">🐦 Twitter/X</option>
              <option value="instagram">📸 Instagram</option>
              <option value="linkedin">💼 LinkedIn</option>
              <option value="youtube">📺 YouTube</option>
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
              <option value="professional">🎯 Professional</option>
              <option value="casual">😊 Casual</option>
              <option value="informative">📚 Informative</option>
              <option value="engaging">✨ Engaging</option>
              <option value="humorous">😄 Humorous</option>
            </select>
          </div>
        </div>

        {/* Thread Settings */}
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
              <option value="short">
                Short (~
                {PLATFORM_LIMITS[platform].short}
                {' '}
                chars)
              </option>
              <option value="medium">
                Medium (~
                {PLATFORM_LIMITS[platform].medium}
                {' '}
                chars)
              </option>
              <option value="long">
                Long (~
                {PLATFORM_LIMITS[platform].long}
                {' '}
                chars)
              </option>
              {platform === 'twitter' && (
                <option value="x-pro">
                  X Pro (~
                  {PLATFORM_LIMITS[platform]['x-pro']}
                  {' '}
                  chars)
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Platform Info */}
        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
          {platform === 'twitter'
            ? (
                <Twitter className="h-3 w-3 text-blue-500" />
              )
            : platform === 'instagram'
              ? (
                  <Instagram className="h-3 w-3 text-pink-500" />
                )
              : platform === 'youtube'
                ? (
                    <Youtube className="h-3 w-3 text-red-500" />
                  )
                : (
                    <Linkedin className="h-3 w-3 text-blue-600" />
                  )}
          <div className="text-xs text-muted-foreground">
            Optimized for
            {' '}
            {platform === 'twitter' ? 'Twitter/X' : platform === 'instagram' ? 'Instagram' : platform === 'youtube' ? 'YouTube' : 'LinkedIn'}
            {' '}
            • Max
            {' '}
            {getCharacterLimit()}
            {' '}
            chars per post
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-md border border-red-500 bg-red-50 dark:bg-red-950 px-2 py-1 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}

        {/* Generated Thread */}
        {thread.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">
                🎉 Generated
                {' '}
                {thread.length}
                {' '}
                posts
              </div>
              <Button
                className="h-6 px-2 text-xs"
                onClick={copyEntireThread}
                size="sm"
                variant="ghost"
              >
                {copied === -1
                  ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )
                  : (
                      <Copy className="h-3 w-3" />
                    )}
                Copy All
              </Button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2">
              {(previewMode ? thread : thread.slice(0, 3)).map((post, index) => (
                <div
                  className={`bg-muted/50 rounded p-3 text-xs border-l-2 ${
                    platform === 'twitter' ? 'border-l-blue-500' : platform === 'instagram' ? 'border-l-pink-500' : platform === 'youtube' ? 'border-l-red-500' : 'border-l-blue-600'
                  }`}
                  key={index}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                          {index + 1}
                          /
                          {thread.length}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {post.length}
                          {' '}
                          chars
                        </div>
                      </div>
                      <div className="whitespace-pre-line">
                        {previewMode
                          ? post
                          : (
                              <>
                                {post.substring(0, 120)}
                                {post.length > 120 ? '...' : ''}
                              </>
                            )}
                      </div>
                    </div>
                    <Button
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={() => copyToClipboard(post, index)}
                      size="sm"
                      variant="ghost"
                    >
                      {copied === index
                        ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )
                        : (
                            <Copy className="h-3 w-3" />
                          )}
                    </Button>
                  </div>
                </div>
              ))}

              {!previewMode && thread.length > 3 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  +
                  {thread.length - 3}
                  {' '}
                  more posts...
                  <Button
                    className="h-auto p-0 ml-2 text-xs"
                    onClick={() => setPreviewMode(true)}
                    size="sm"
                    variant="link"
                  >
                    Show all
                  </Button>
                </div>
              )}
            </div>

            <Button
              className="w-full text-xs h-7"
              onClick={openFullGenerator}
              size="sm"
              variant="outline"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              {thread.length > 0 ? 'Continue Editing in Full Tool' : 'Open Full Tool'}
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 text-xs h-8"
            disabled={loading || !isTopicValid || topicTooLong}
            onClick={handleGenerate}
            size="sm"
          >
            {loading
              ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Generating...
                  </>
                )
              : (
                  <>
                    <Sparkles className="mr-1 h-3 w-3" />
                    Generate Thread
                  </>
                )}
          </Button>
          <Button
            className="text-xs h-8"
            onClick={openFullGenerator}
            size="sm"
            title={thread.length > 0 ? 'Continue editing this thread in full tool' : 'Open full thread generator'}
            variant="outline"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
