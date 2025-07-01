/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Instagram, Copy, Check, Clock, Eye, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Story {
  title: string;
  textContent: string;
  interactiveElement: string;
  visual: string;
  hashtags: string;
  duration: string;
  fullContent: string;
}

interface StoryResponse {
  stories: Story[];
  topic: string;
  platform: string;
  storyType: string;
  storyCount: number;
  tone: string;
  targetAudience: string;
  includeVisualSuggestions: boolean;
  totalStories: number;
  fullContent: string;
}

export default function StoryGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "facebook" | "both">("instagram");
  const [storyType, setStoryType] = useState<"promotional" | "behind-the-scenes" | "educational" | "entertaining" | "poll" | "qa" | "lifestyle">("educational");
  const [storyCount, setStoryCount] = useState(5);
  const [tone, setTone] = useState<"casual" | "professional" | "energetic" | "friendly" | "humorous">("casual");
  const [targetAudience, setTargetAudience] = useState<"general" | "young-adults" | "professionals" | "parents" | "entrepreneurs">("general");
  const [includeVisualSuggestions, setIncludeVisualSuggestions] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [previewStory, setPreviewStory] = useState<Story | null>(null);
  const [savedStories, setSavedStories] = useState<Story[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setStories([]);
    
    try {
      const res = await fetch("/api/ai/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic, 
          platform, 
          storyType, 
          storyCount, 
          tone, 
          targetAudience, 
          includeVisualSuggestions 
        }),
      });
      
      const data: unknown = await res.json();
      
      if (res.ok && typeof data === "object" && data !== null && "stories" in data) {
        const responseData = data as StoryResponse;
        setStories(responseData.stories || []);
      } else {
        setError(
          typeof data === "object" && data !== null && "error" in data
            ? ((data as { error?: string }).error ?? "Failed to generate stories")
            : "Failed to generate stories"
        );
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const copyAllStories = async () => {
    try {
      const allStoriesText = stories.map((story, index) => 
        `Story ${index + 1}: ${story.title}\n\n${story.textContent}\n\nInteractive: ${story.interactiveElement}\n\nHashtags: ${story.hashtags}\n\n---\n`
      ).join('\n');
      
      await navigator.clipboard.writeText(allStoriesText);
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getStoryTypeDisplay = (type: string) => {
    const types = {
      'promotional': 'Promotional',
      'behind-the-scenes': 'Behind the Scenes',
      'educational': 'Educational',
      'entertaining': 'Entertaining',
      'poll': 'Poll/Interactive',
      'qa': 'Q&A',
      'lifestyle': 'Lifestyle'
    };
    return types[type as keyof typeof types] || type;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="size-4" />;
      case 'facebook':
        return <div className="size-4 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">f</div>;
      case 'both':
        return <div className="flex gap-1"><Instagram className="size-3" /><div className="size-3 rounded bg-blue-600"></div></div>;
      default:
        return <Instagram className="size-4" />;
    }
  };

  // Load saved stories from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("savedStories");
    if (saved) setSavedStories(JSON.parse(saved));
  }, []);

  const handleSaveStory = (story: Story) => {
    const updated = [...savedStories, story];
    setSavedStories(updated);
    localStorage.setItem("savedStories", JSON.stringify(updated));
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10 px-2">
      <div className="grid gap-6 max-w-5xl w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Instagram className="size-6 text-primary" />
              <div>
                <CardTitle>Story Generator</CardTitle>
                <CardDescription>
                  Create engaging Instagram and Facebook stories with AI assistance for any topic or campaign.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="topic" className="text-sm font-medium">
                Story Topic
              </Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What do you want to create stories about? (e.g., 'New product launch', 'Daily routine', 'Industry tips')"
                rows={3}
                className="mt-1 resize-y"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="platform" className="text-sm font-medium">
                  Platform
                </Label>
                <Select value={platform} onValueChange={(value: typeof platform) => setPlatform(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="both">Both Platforms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="storyType" className="text-sm font-medium">
                  Story Type
                </Label>
                <Select value={storyType} onValueChange={(value: typeof storyType) => setStoryType(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="behind-the-scenes">Behind the Scenes</SelectItem>
                    <SelectItem value="entertaining">Entertaining</SelectItem>
                    <SelectItem value="poll">Poll/Interactive</SelectItem>
                    <SelectItem value="qa">Q&A</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tone" className="text-sm font-medium">
                  Tone
                </Label>
                <Select value={tone} onValueChange={(value: typeof tone) => setTone(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetAudience" className="text-sm font-medium">
                  Target Audience
                </Label>
                <Select value={targetAudience} onValueChange={(value: typeof targetAudience) => setTargetAudience(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="young-adults">Young Adults</SelectItem>
                    <SelectItem value="professionals">Professionals</SelectItem>
                    <SelectItem value="parents">Parents</SelectItem>
                    <SelectItem value="entrepreneurs">Entrepreneurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="storyCount" className="text-sm font-medium">
                  Number of Stories
                </Label>
                <Input
                  id="storyCount"
                  type="number"
                  min={1}
                  max={10}
                  value={storyCount}
                  onChange={(e) => setStoryCount(parseInt(e.target.value) || 5)}
                  className="mt-1"
                  disabled={loading}
                  placeholder="5"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="visualSuggestions" 
                  checked={includeVisualSuggestions}
                  onCheckedChange={(checked) => setIncludeVisualSuggestions(checked as boolean)}
                />
                <Label htmlFor="visualSuggestions" className="text-sm font-medium">
                  Include Visual Suggestions
                </Label>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-destructive text-sm">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerate}
              disabled={loading || topic.length < 3}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> 
                  Generating Stories...
                </>
              ) : (
                <>
                  <Instagram className="mr-2 size-4" />
                  Generate Stories
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {loading && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Generating Stories...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[...Array(storyCount)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {stories.length > 0 && !loading && (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getPlatformIcon(platform)}
                  <div>
                    <CardTitle className="text-xl">Generated Stories</CardTitle>
                    <CardDescription>
                      {stories.length} {getStoryTypeDisplay(storyType).toLowerCase()} stories • {tone} tone • {targetAudience.replace('-', ' ')} audience
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllStories}
                  className="flex items-center gap-2"
                  aria-label="Copy all stories"
                >
                  {copiedIndex === -1 ? (
                    <>
                      <Check className="size-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {stories.map((story, index) => (
                  <StoryCard
                    key={index}
                    story={story}
                    index={index}
                    copiedIndex={copiedIndex}
                    includeVisualSuggestions={includeVisualSuggestions}
                    onCopy={copyToClipboard}
                    onPreview={setPreviewStory}
                    onSave={handleSaveStory}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- Modal for story preview --- */}
        <Dialog open={!!previewStory} onOpenChange={() => setPreviewStory(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{previewStory?.title}</DialogTitle>
              <DialogDescription>Full Story Preview</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded text-sm">
                {previewStory?.textContent}
              </div>
              <div className="text-xs text-muted-foreground">
                Words: {previewStory ? getWordCount(previewStory.textContent) : 0} • Read: ~{previewStory ? getReadingTime(previewStory.textContent) : 0} min
              </div>
              <div>
                <strong>Interactive:</strong> {previewStory?.interactiveElement}
              </div>
              {previewStory?.visual && (
                <div>
                  <strong>Visual:</strong> {previewStory.visual}
                </div>
              )}
              <div>
                <strong>Hashtags:</strong> {previewStory?.hashtags}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => previewStory && copyToClipboard(previewStory.fullContent, -2)} aria-label="Copy story from modal">
                <Copy className="size-4 mr-2" /> Copy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// --- New: StoryCard sub-component ---
interface StoryCardProps {
  story: Story;
  index: number;
  copiedIndex: number | null;
  includeVisualSuggestions: boolean;
  onCopy: (content: string, index: number) => void;
  onPreview: (story: Story) => void;
  onSave: (story: Story) => void;
}

function getWordCount(text: string) {
  return text.trim().split(/\s+/).length;
}
function getReadingTime(text: string) {
  const wordsPerMinute = 200;
  const words = getWordCount(text);
  return Math.max(1, Math.round(words / wordsPerMinute));
}

const StoryCard = ({ story, index, copiedIndex, includeVisualSuggestions, onCopy, onPreview, onSave }: StoryCardProps) => (
  <div className="border rounded-lg p-4 space-y-3" aria-label={`Story ${index + 1}`}> 
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          Story {index + 1}
        </Badge>
        <h3 className="font-semibold text-lg">{story.title}</h3>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Preview story"
          onClick={() => onPreview(story)}
        >
          <Eye className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Copy story"
          onClick={() => onCopy(story.fullContent, index)}
        >
          {copiedIndex === index ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Save story"
          onClick={() => onSave(story)}
        >
          <span role="img" aria-label="Save">💾</span>
        </Button>
      </div>
    </div>
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Eye className="size-3" /> Content
        </h4>
        <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded">
          {story.textContent}
        </p>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Words: {getWordCount(story.textContent)}</span>
        <span>Read: ~{getReadingTime(story.textContent)} min</span>
      </div>
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-1">Interactive Element</h4>
        <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
          {story.interactiveElement}
        </p>
      </div>
      {includeVisualSuggestions && story.visual && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Visual Suggestions</h4>
          <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
            {story.visual}
          </p>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-4">
          {story.hashtags && (
            <div className="flex items-center gap-1">
              <Hash className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {story.hashtags.split(' ').map((tag, i) => (
                  <button
                    key={i}
                    className="hover:underline text-primary"
                    onClick={() => navigator.clipboard.writeText(tag)}
                    aria-label={`Copy hashtag ${tag}`}
                  >{tag} </button>
                ))}
              </span>
            </div>
          )}
        </div>
        {story.duration && (
          <div className="flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {story.duration}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);
// --- End StoryCard --- 