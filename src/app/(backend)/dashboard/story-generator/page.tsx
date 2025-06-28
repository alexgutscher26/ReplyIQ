"use client";

import { useState } from "react";
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

/**
 * StoryGeneratorPage component for generating social media stories.
 *
 * This component manages user inputs and interactions to generate stories based on specified parameters such as topic, platform,
 * story type, number of stories, tone, target audience, and visual suggestions. It handles state management using React hooks,
 * makes API calls to fetch generated stories, and provides functionality to copy individual or all stories to the clipboard.
 *
 * The component renders a form for user inputs and displays the generated stories with options to copy each story or all stories
 * at once. It also includes error handling and loading states to enhance user experience.
 */
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

  /**
   * Handles the generation of stories based on provided parameters.
   *
   * This function sets loading state to true and clears any previous errors or stories.
   * It then sends a POST request to the `/api/ai/stories` endpoint with the specified parameters.
   * If the response is successful and contains valid story data, it updates the stories state.
   * If there's an error in the response or network failure, it sets an appropriate error message.
   * Finally, it resets the loading state regardless of the outcome.
   *
   * @param topic - The topic for which stories are to be generated.
   * @param platform - The platform where the stories will be published.
   * @param storyType - The type of stories to generate.
   * @param storyCount - The number of stories to generate.
   * @param tone - The desired tone of the stories.
   * @param targetAudience - The target audience for the stories.
   * @param includeVisualSuggestions - Whether to include visual suggestions in the stories.
   */
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

  /**
   * Copies the given content to the clipboard and sets a copied index with a timeout.
   */
  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  /**
   * Copies all stories as formatted text to the clipboard.
   */
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

  /**
   * Retrieves the display name for a given story type.
   */
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

  /**
   * Determines and returns an icon component based on the specified platform.
   *
   * This function uses a switch statement to match the input platform string to one of several predefined cases:
   * - 'instagram': Returns an Instagram icon with a specific size and class.
   * - 'facebook': Returns a custom styled div representing the Facebook icon, including background color, text alignment, and size.
   * - 'both': Combines Instagram and Facebook icons within a flex container.
   * For any other platform, it defaults to returning the Instagram icon.
   *
   * @param platform - The string identifier for the platform whose icon is to be returned.
   */
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

        {stories.length > 0 && (
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
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Story {index + 1}
                        </Badge>
                        <h3 className="font-semibold text-lg">{story.title}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(story.fullContent, index)}
                        className="shrink-0"
                      >
                        {copiedIndex === index ? (
                          <Check className="size-4" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
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
                                {story.hashtags}
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 