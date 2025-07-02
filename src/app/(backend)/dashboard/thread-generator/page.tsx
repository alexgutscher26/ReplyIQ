/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, MessageSquare, Copy, Check, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface ThreadResponse {
  thread: string[];
  topic: string;
  platform: string;
  tone: string;
  totalPosts: number;
}

type Platform = "instagram" | "linkedin" | "twitter" | "youtube";

export default function ThreadGeneratorPage() {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<Platform>("twitter");
  const [threadLength, setThreadLength] = useState(5);
  const [postLength, setPostLength] = useState<
    "short" | "medium" | "long" | "x-pro"
  >("short");
  const [tone, setTone] = useState<
    "professional" | "casual" | "informative" | "engaging" | "humorous"
  >("engaging");
  const [thread, setThread] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loadedFromExtension, setLoadedFromExtension] = useState(false);
  const [showError, setShowError] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedPosts, setEditedPosts] = useState<string[]>([]);

  const topicInputRef = useRef<HTMLTextAreaElement>(null);

  // Load thread data transferred from extension
  useEffect(() => {
    const fromExtension = searchParams.get("from") === "extension";
    if (fromExtension) {
      try {
        // Load data from URL parameters
        const topicParam = searchParams.get("topic");
        const platformParam = searchParams.get("platform");
        const toneParam = searchParams.get("tone");
        const threadLengthParam = searchParams.get("threadLength");
        const postLengthParam = searchParams.get("postLength");
        const threadParam = searchParams.get("thread");

        // Set form data from URL parameters
        if (topicParam) {
          setTopic(topicParam);
        }
        if (
          platformParam === "twitter" ||
          platformParam === "instagram" ||
          platformParam === "linkedin" ||
          platformParam === "youtube"
        ) {
          setPlatform(platformParam);
        }
        if (
          toneParam === "professional" ||
          toneParam === "casual" ||
          toneParam === "informative" ||
          toneParam === "engaging" ||
          toneParam === "humorous"
        ) {
          setTone(toneParam);
        }
        if (threadLengthParam) {
          const length = Number.parseInt(threadLengthParam, 10);
          if (!Number.isNaN(length)) {
            setThreadLength(length);
          }
        }
        if (
          postLengthParam === "short" ||
          postLengthParam === "medium" ||
          postLengthParam === "long" ||
          postLengthParam === "x-pro"
        ) {
          setPostLength(postLengthParam);
        }

        // Decode and set thread data if available
        if (threadParam) {
          try {
            const decodedThread = decodeURIComponent(escape(atob(threadParam)));
            const threadArray: unknown = JSON.parse(decodedThread);
            if (Array.isArray(threadArray)) {
              const validThread = threadArray.filter(
                (item): item is string => typeof item === "string",
              );
              if (validThread.length > 0) {
                setThread(validThread);
              }
            }
          } catch (decodeError) {
            console.error("Failed to decode thread data:", decodeError);
          }
        }

        setLoadedFromExtension(true);
      } catch (err) {
        console.error("Failed to load extension data:", err);
      }
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setThread([]);
    try {
      const res = await fetch("/api/ai/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          platform,
          threadLength,
          postLength,
          tone,
        }),
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
            ? ((data as { error?: string }).error ??
                "Failed to generate thread")
            : "Failed to generate thread",
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
      console.error("Failed to copy text: ", err);
    }
  };

  const copyAllThread = async () => {
    const threadText = thread
      .map((post, index) => `${index + 1}/${thread.length}\n\n${post}`)
      .join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(threadText);
      setCopiedIndex(-1); // Special index for "copy all"
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy thread: ", err);
    }
  };

  const resetAll = () => {
    setTopic("");
    setPlatform("twitter");
    setThreadLength(5);
    setPostLength("short");
    setTone("engaging");
    setThread([]);
    setEditedPosts([]);
    setError(null);
    setShowError(true);
    setCopiedIndex(null);
  };

  // Inline editing
  useEffect(() => {
    setEditedPosts(thread);
  }, [thread]);

  const handleEditPost = (value: string, idx: number) => {
    setEditedPosts((prev) => prev.map((p, i) => (i === idx ? value : p)));
  };

  // Reading time estimate
  const getReadingTime = () => {
    const totalWords = editedPosts.reduce(
      (acc, post) => acc + post.split(/\s+/).length,
      0,
    );
    return Math.max(1, Math.round(totalWords / 200)); // 200 wpm
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-2 py-10">
      <div className="w-full max-w-xl space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <MessageSquare className="text-primary size-6" />
              <div>
                <CardTitle>Thread Generator</CardTitle>
                <CardDescription>
                  Create engaging Twitter or LinkedIn threads with AI
                  assistance.
                  {loadedFromExtension && (
                    <span className="ml-2 inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      📱 Loaded from Extension
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label
                htmlFor="topic"
                className="flex items-center gap-2 text-sm font-medium"
              >
                Thread Topic
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info
                        className="text-muted-foreground ml-1 size-4 cursor-pointer"
                        aria-label="Thread topic info"
                      />
                    </TooltipTrigger>
                    <TooltipContent>What is your thread about?</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Textarea
                id="topic"
                ref={topicInputRef}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What would you like to create a thread about? (e.g., 'The importance of AI in modern business')"
                rows={3}
                className="mt-1 resize-y"
                disabled={loading}
                aria-describedby="topic-char-count"
              />
              <span
                id="topic-char-count"
                className="text-muted-foreground mt-1 block text-right text-xs"
              >
                {topic.length} chars
              </span>
            </div>
            <div className="mb-4">
              <Label
                htmlFor="platform"
                className="flex items-center gap-2 text-sm font-medium"
              >
                Platform
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info
                        className="text-muted-foreground ml-1 size-4 cursor-pointer"
                        aria-label="Platform info"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Choose where you'll post this thread.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={platform}
                onValueChange={(value: Platform) => setPlatform(value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mb-4">
              <Label
                htmlFor="threadLength"
                className="flex items-center gap-2 text-sm font-medium"
              >
                Thread Length (posts)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info
                        className="text-muted-foreground ml-1 size-4 cursor-pointer"
                        aria-label="Thread length info"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      How many posts in the thread? (2-20)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="threadLength"
                type="number"
                min={2}
                max={20}
                value={threadLength}
                onChange={(e) =>
                  setThreadLength(Number.parseInt(e.target.value) || 5)
                }
                className="mt-1"
                disabled={loading}
                placeholder="5"
                aria-describedby="thread-length-info"
              />
            </div>
            <div className="mb-4">
              <Label
                htmlFor="postLength"
                className="flex items-center gap-2 text-sm font-medium"
              >
                Post Length
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info
                        className="text-muted-foreground ml-1 size-4 cursor-pointer"
                        aria-label="Post length info"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      How long should each post be?
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={postLength}
                onValueChange={(value: typeof postLength) =>
                  setPostLength(value)
                }
              >
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
            <div className="mb-4">
              <Label
                htmlFor="tone"
                className="flex items-center gap-2 text-sm font-medium"
              >
                Tone
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info
                        className="text-muted-foreground ml-1 size-4 cursor-pointer"
                        aria-label="Tone info"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Choose the style of your thread.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={tone}
                onValueChange={(value: typeof tone) => setTone(value)}
              >
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
            {error && showError && (
              <div
                className="border-destructive bg-destructive/10 text-destructive mb-4 flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                role="alert"
              >
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowError(false)}
                  aria-label="Dismiss error"
                >
                  ×
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-end gap-2">
            <Button
              onClick={handleGenerate}
              disabled={loading || topic.length < 3}
              className="w-full"
              size="lg"
              aria-label="Generate Thread"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Generating
                  Thread...
                </>
              ) : (
                "Generate Thread"
              )}
            </Button>
            <Button
              onClick={resetAll}
              disabled={loading && thread.length === 0}
              variant="secondary"
              aria-label="Clear"
              className="w-full"
            >
              Clear
            </Button>
          </CardFooter>
        </Card>
        {thread.length > 0 && (
          <Card className="mt-8 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Generated Thread</CardTitle>
                  <CardDescription>
                    {thread.length} posts for {platform} • {tone} tone • ~
                    {getReadingTime()} min read
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllThread}
                  className="flex items-center gap-2"
                  aria-label="Copy All Posts"
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
                <AnimatePresence>
                  {editedPosts.map((post, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-muted/50 border-border relative rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {platform === "twitter"
                                ? postLength === "short"
                                  ? `${post.length}/280 chars`
                                  : postLength === "medium"
                                    ? `${post.length}/2,200 chars`
                                    : postLength === "long"
                                      ? `${post.length}/4,000 chars`
                                      : `${post.length}/25,000 chars (X Pro)`
                                : platform === "instagram"
                                  ? postLength === "short"
                                    ? `${post.length}/1,000 chars`
                                    : postLength === "medium"
                                      ? `${post.length}/1,500 chars`
                                      : postLength === "long"
                                        ? `${post.length}/2,200 chars`
                                        : `${post.length}/2,200 chars (X Pro)`
                                  : platform === "linkedin"
                                    ? postLength === "short"
                                      ? `${post.length}/1,300 chars`
                                      : postLength === "medium"
                                        ? `${post.length}/2,000 chars`
                                        : postLength === "long"
                                          ? `${post.length}/3,000 chars`
                                          : `${post.length}/3,000 chars (X Pro)`
                                    : platform === "youtube"
                                      ? postLength === "short"
                                        ? `${post.length}/2,000 chars`
                                        : postLength === "medium"
                                          ? `${post.length}/3,000 chars`
                                          : postLength === "long"
                                            ? `${post.length}/5,000 chars`
                                            : `${post.length}/5,000 chars (X Pro)`
                                      : `${post.length} chars`}
                            </span>
                            <span className="text-muted-foreground ml-2 text-xs">
                              {post.split(/\s+/).length} words
                            </span>
                          </div>
                          {editingIndex === index ? (
                            <Textarea
                              value={post}
                              onChange={(e) =>
                                handleEditPost(e.target.value, index)
                              }
                              onBlur={() => setEditingIndex(null)}
                              autoFocus
                              className="mb-2"
                              aria-label={`Edit post ${index + 1}`}
                            />
                          ) : (
                            <div
                              className="cursor-pointer text-sm leading-relaxed"
                              tabIndex={0}
                              role="button"
                              aria-label={`Edit post ${index + 1}`}
                              onClick={() => setEditingIndex(index)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") setEditingIndex(index);
                              }}
                            >
                              {post.split("\n\n").map((paragraph, pIndex) => (
                                <p
                                  key={pIndex}
                                  className={pIndex > 0 ? "mt-3" : ""}
                                >
                                  {paragraph.split("\n").map((line, lIndex) => (
                                    <span key={lIndex}>
                                      {line}
                                      {lIndex <
                                        paragraph.split("\n").length - 1 && (
                                        <br />
                                      )}
                                    </span>
                                  ))}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(post, index)}
                          className="shrink-0"
                          aria-label={`Copy post ${index + 1}`}
                        >
                          {copiedIndex === index ? (
                            <Check className="size-4" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
