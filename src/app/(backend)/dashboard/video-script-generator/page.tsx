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
import { Loader2, Video, Copy, Check } from "lucide-react";

interface ScriptResponse {
  script: {
    fullScript: string;
    title: string;
    hook: string;
    introduction: string;
    mainContent: string;
    conclusion: string;
    callToAction: string;
    technicalNotes: string;
  };
  topic: string;
  videoType: string;
  duration: number;
  tone: string;
  platform: string;
}

export default function VideoScriptGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [videoType, setVideoType] = useState<"educational" | "promotional" | "entertainment" | "tutorial" | "explainer">("educational");
  const [duration, setDuration] = useState(5);
  const [tone, setTone] = useState<"professional" | "casual" | "energetic" | "calm" | "humorous">("professional");
  const [platform, setPlatform] = useState<"youtube" | "tiktok" | "instagram" | "general">("youtube");
  const [script, setScript] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setScript("");
    try {
      const res = await fetch("/api/ai/video-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, videoType, duration, tone, platform }),
      });
      const data: unknown = await res.json();
      if (res.ok && typeof data === "object" && data !== null && "script" in data) {
        const scriptData = (data as ScriptResponse).script;
        setScript(scriptData.fullScript || "No script generated");
      } else {
        setError(
          typeof data === "object" && data !== null && "error" in data
            ? ((data as { error?: string }).error ?? "Failed to generate script")
            : "Failed to generate script"
        );
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10 px-2">
      <div className="grid gap-6 max-w-4xl w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Video className="size-6 text-primary" />
              <div>
                <CardTitle>Video Script Generator</CardTitle>
                <CardDescription>
                  Create professional video scripts with AI assistance for any platform.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="topic" className="text-sm font-medium">
                Video Topic
              </Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What's your video about? (e.g., 'How to start a small business online')"
                rows={3}
                className="mt-1 resize-y"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="videoType" className="text-sm font-medium">
                  Video Type
                </Label>
                <Select value={videoType} onValueChange={(value: typeof videoType) => setVideoType(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="explainer">Explainer</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="platform" className="text-sm font-medium">
                  Platform
                </Label>
                <Select value={platform} onValueChange={(value: typeof platform) => setPlatform(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration" className="text-sm font-medium">
                  Duration (minutes)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={60}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
                  className="mt-1"
                  disabled={loading}
                />
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
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
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

            {script && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Generated Video Script:</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="size-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        Copy Script
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 border border-border max-h-96 overflow-y-auto">
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {script}
                  </pre>
                </div>
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
                  <Loader2 className="mr-2 size-4 animate-spin" /> Generating Script...
                </>
              ) : (
                <>
                  <Video className="mr-2 size-4" />
                  Generate Video Script
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 