"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, MessageSquare, Copy, Check } from "lucide-react";

interface ThreadResponse {
  thread: string[];
  topic: string;
  platform: string;
  tone: string;
  totalPosts: number;
}

export default function ThreadGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<"twitter" | "linkedin">("twitter");
  const [threadLength, setThreadLength] = useState(5);
  const [postLength, setPostLength] = useState<"short" | "medium" | "long" | "x-pro">("short");
  const [tone, setTone] = useState<"professional" | "casual" | "informative" | "engaging" | "humorous">("engaging");
  const [thread, setThread] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setThread([]);
    try {
      const res = await fetch("/api/ai/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, threadLength, postLength, tone }),
      });
      const data: unknown = await res.json();
      if (
        res.ok &&
        typeof data === "object" &&
        data !== null &&
        Array.isArray((data as ThreadResponse).thread)
      ) {
        setThread((data as ThreadResponse).thread ?? []);
      } else {
        setError(
          typeof data === "object" && data !== null && "error" in data
            ? ((data as { error?: string }).error ?? "Failed to generate thread")
            : "Failed to generate thread"
        );
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const copyAllThread = async () => {
    const threadText = thread.map((post, index) => `${index + 1}/${thread.length}\n\n${post}`).join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(threadText);
      setCopiedIndex(-1); // Special index for "copy all"
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy thread: ', err);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="grid gap-6 max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <MessageSquare className="size-6 text-primary" />
              <div>
                <CardTitle>Thread Generator</CardTitle>
                <CardDescription>
                  Create engaging Twitter or LinkedIn threads with AI assistance.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="topic" className="text-sm font-medium">
                Thread Topic
              </Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What would you like to create a thread about? (e.g., 'The importance of AI in modern business')"
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
                <Select value={platform} onValueChange={(value: "twitter" | "linkedin") => setPlatform(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="threadLength" className="text-sm font-medium">
                  Thread Length (posts)
                </Label>
                <Input
                  id="threadLength"
                  type="number"
                  min={2}
                  max={20}
                  value={threadLength}
                  onChange={(e) => setThreadLength(Number.parseInt(e.target.value) || 5)}
                  className="mt-1"
                  disabled={loading}
                  placeholder="5"
                />
              </div>

              <div>
                <Label htmlFor="postLength" className="text-sm font-medium">
                  Post Length
                </Label>
                <Select value={postLength} onValueChange={(value: typeof postLength) => setPostLength(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select post length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (50-100 words)</SelectItem>
                    <SelectItem value="medium">Medium (100-200 words)</SelectItem>
                    <SelectItem value="long">Long (200-500 words)</SelectItem>
                    <SelectItem value="x-pro">X Pro (500+ words)</SelectItem>
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
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="informative">Informative</SelectItem>
                    <SelectItem value="engaging">Engaging</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Loader2 className="mr-2 size-4 animate-spin" /> Generating Thread...
                </>
              ) : (
                "Generate Thread"
              )}
            </Button>
          </CardFooter>
        </Card>

        {thread.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Generated Thread</CardTitle>
                  <CardDescription>
                    {thread.length} posts for {platform} • {tone} tone
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllThread}
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
              <div className="space-y-4">
                {thread.map((post, index) => (
                  <div
                    key={index}
                    className="relative bg-muted/50 rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                            {index + 1}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {platform === 'twitter' ? (
                              postLength === 'short' ? `${post.length}/280 chars` :
                              postLength === 'medium' ? `${post.length}/2,200 chars` :
                              postLength === 'long' ? `${post.length}/4,000 chars` :
                              `${post.length}/25,000 chars (X Pro)`
                            ) : `${post.length} chars`}
                          </span>
                        </div>
                        <div className="text-sm leading-relaxed">
                          {post.split('\n\n').map((paragraph, pIndex) => (
                            <p key={pIndex} className={pIndex > 0 ? "mt-3" : ""}>
                              {paragraph.split('\n').map((line, lIndex) => (
                                <span key={lIndex}>
                                  {line}
                                  {lIndex < paragraph.split('\n').length - 1 && <br />}
                                </span>
                              ))}
                            </p>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(post, index)}
                        className="shrink-0"
                      >
                        {copiedIndex === index ? (
                          <Check className="size-4" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
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