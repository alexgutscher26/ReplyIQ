"use client";

import { useState } from "react";
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
import { Loader2, Hash } from "lucide-react";

export default function HashtagGeneratorPage() {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setHashtags([]);
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
          />
          {error && (
            <div className="mb-4 rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-destructive text-sm">
              {error}
            </div>
          )}
          {hashtags.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold mb-2">Suggested Hashtags:</h2>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted px-2 py-1 rounded text-sm font-mono border border-border"
                  >
                    {tag}
                  </span>
                ))}
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