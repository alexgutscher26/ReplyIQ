/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, Hash, Copy, Check, Save } from "lucide-react";

// --- New: HashtagChip sub-component ---
interface HashtagChipProps {
  tag: string;
  onCopy: (tag: string) => void;
  copied: boolean;
  onSave: (tag: string) => void;
  saved: boolean;
}

/**
 * Renders a hashtag chip with copy and save functionality.
 */
const HashtagChip = ({ tag, onCopy, copied, onSave, saved }: HashtagChipProps) => (
  <span className="bg-muted px-2 py-1 rounded text-sm font-mono border border-border flex items-center gap-1" tabIndex={0} aria-label={`Hashtag ${tag}`}> 
    {tag}
    <button
      className="ml-1 text-primary hover:underline"
      onClick={() => onCopy(tag)}
      aria-label={`Copy hashtag ${tag}`}
      tabIndex={0}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
    <button
      className="ml-1 text-green-600 hover:underline"
      onClick={() => onSave(tag)}
      aria-label={`Save hashtag ${tag}`}
      tabIndex={0}
    >
      {saved ? <Check className="size-3" /> : <Save className="size-3" />}
    </button>
  </span>
);
// --- End HashtagChip ---

/**
 * The main component for generating hashtags from user input content.
 *
 * This component manages the state of input content, generated hashtags, loading status,
 * errors, and saved hashtags. It fetches hashtag suggestions from an API and provides
 * functionality to copy individual or all hashtags, save them, and display analytics.
 *
 * @returns A React functional component rendering a card with input fields, buttons for actions,
 *          and display areas for generated and saved hashtags.
 */
export default function HashtagGeneratorPage() {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [savedTags, setSavedTags] = useState<string[]>([]);

  // Load saved hashtags from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("savedHashtags");
    if (saved) setSavedTags(JSON.parse(saved));
  }, []);

  /**
   * Handles the generation of hashtags from given content.
   *
   * It initiates a loading state, clears previous errors and states,
   * sends a POST request to the server with the provided content,
   * processes the response to update hashtags or set an error message accordingly,
   * and finally stops the loading state.
   *
   * @returns A promise that resolves when the operation is complete.
   */
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setHashtags([]);
    setCopiedAll(false);
    setCopiedTag(null);
    try {
      const res = await fetch("/api/ai/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data: unknown = await res.json();
      if (
        res.ok &&
        typeof data === "object" &&
        data !== null &&
        Array.isArray((data as { hashtags?: unknown }).hashtags)
      ) {
        setHashtags((data as { hashtags: string[] }).hashtags ?? []);
      } else {
        setError(
          typeof data === "object" && data !== null && "error" in data
            ? ((data as { error?: string }).error ?? "Failed to generate hashtags")
            : "Failed to generate hashtags"
        );
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copies a given tag to the clipboard and sets a timeout to clear the copied tag state.
   */
  const handleCopyTag = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 1500);
    } catch {}
  };

  /**
   * Copies all hashtags to the clipboard and sets copied state.
   */
  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(hashtags.join(" "));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {}
  };

  /**
   * Adds a new tag to the saved tags list and updates local storage if it's not already present.
   */
  const handleSaveTag = (tag: string) => {
    if (!savedTags.includes(tag)) {
      const updated = [...savedTags, tag];
      setSavedTags(updated);
      localStorage.setItem("savedHashtags", JSON.stringify(updated));
    }
  };

  // --- Analytics ---
  const hashtagCount = hashtags.length;
  const totalChars = hashtags.reduce((acc, tag) => acc + tag.length, 0);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10 px-2">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Hash className="size-6 text-primary" />
            <div>
              <CardTitle>Hashtag Generator</CardTitle>
              <CardDescription>
                Enter your post content below and get AI-powered hashtag suggestions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your post content here..."
            rows={5}
            className="mb-4 resize-y"
            disabled={loading}
            aria-label="Post content input"
          />
          {error && (
            <div className="mb-4 rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-destructive text-sm flex items-center justify-between">
              {error}
              <Button variant="ghost" size="sm" onClick={handleGenerate} aria-label="Retry">
                Retry
              </Button>
            </div>
          )}
          {loading && (
            <div className="mt-6 flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="bg-muted px-2 py-1 rounded text-sm font-mono border border-border opacity-50 animate-pulse w-20 h-6" />
              ))}
            </div>
          )}
          {hashtags.length > 0 && !loading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Suggested Hashtags:</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAll}
                    aria-label="Copy all hashtags"
                  >
                    {copiedAll ? <Check className="size-4" /> : <Copy className="size-4" />} Copy All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      hashtags.forEach(handleSaveTag);
                    }}
                    aria-label="Save all hashtags"
                  >
                    <Save className="size-4" /> Save All
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <HashtagChip
                    key={tag}
                    tag={tag}
                    onCopy={handleCopyTag}
                    copied={copiedTag === tag}
                    onSave={handleSaveTag}
                    saved={savedTags.includes(tag)}
                  />
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {hashtagCount} hashtags • {totalChars} total characters
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-end gap-2">
          <Button
            onClick={handleGenerate}
            disabled={loading || content.length < 5}
            className="w-full"
            size="lg"
            aria-label="Generate hashtags"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Generating...
              </>
            ) : (
              "Generate Hashtags"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 