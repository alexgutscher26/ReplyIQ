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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Video, 
  Copy, 
  Check, 
  Download, 
  Clock, 
  Users, 
  Target, 
  Sparkles,
  BookOpen,
  Settings,
  History,
  RefreshCw,
  FileText,
  Zap,
  TrendingUp,
  Save
} from "lucide-react";

interface ScriptSection {
  title: string;
  hook: string;
  introduction: string;
  mainContent: string;
  conclusion: string;
  callToAction: string;
  technicalNotes: string;
}

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

interface ScriptAnalysis {
  wordCount: number;
  readingTime: number;
  engagementScore: number;
  suggestions: string[];
}

const SCRIPT_TEMPLATES = [
  {
    id: "tutorial",
    title: "How-To Tutorial",
    description: "Step-by-step instructional content",
    example: "How to create a professional LinkedIn profile in 10 minutes"
  },
  {
    id: "review",
    title: "Product Review",
    description: "Detailed product analysis and recommendations",
    example: "iPhone 15 Pro Review: Is it worth the upgrade?"
  },
  {
    id: "tips",
    title: "Tips & Tricks",
    description: "Quick actionable advice and insights",
    example: "5 productivity hacks that will change your life"
  },
  {
    id: "story",
    title: "Story/Case Study",
    description: "Narrative-driven content with lessons",
    example: "How I built a 6-figure business from my garage"
  }
];

export default function VideoScriptGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [videoType, setVideoType] = useState<"educational" | "promotional" | "entertainment" | "tutorial" | "explainer">("educational");
  const [duration, setDuration] = useState(5);
  const [tone, setTone] = useState<"professional" | "casual" | "energetic" | "calm" | "humorous">("professional");
  const [platform, setPlatform] = useState<"youtube" | "tiktok" | "instagram" | "general">("youtube");
  const [targetAudience, setTargetAudience] = useState("");
  const [keywords, setKeywords] = useState("");
  const [includeHook, setIncludeHook] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);
  const [script, setScript] = useState<string>("");
  const [scriptSections, setScriptSections] = useState<ScriptSection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null);
  const [savedScripts, setSavedScripts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [isCached, setIsCached] = useState(false);

  const analyzeScript = (scriptText: string): ScriptAnalysis => {
    const words = scriptText.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / 150); // Average reading speed
    const sentences = scriptText.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    let engagementScore = 50; // Base score
    if (scriptText.includes("?")) engagementScore += 10; // Questions increase engagement
    if (scriptText.toLowerCase().includes("you")) engagementScore += 10; // Direct address
    if (avgWordsPerSentence < 20) engagementScore += 15; // Shorter sentences are better
    if (scriptText.includes("!")) engagementScore += 5; // Excitement
    
    engagementScore = Math.min(100, Math.max(0, engagementScore));

    const suggestions = [];
    if (words < 100) suggestions.push("Consider adding more detail to reach your target duration");
    if (avgWordsPerSentence > 25) suggestions.push("Try breaking up long sentences for better readability");
    if (!scriptText.includes("?")) suggestions.push("Add questions to increase audience engagement");
    if (engagementScore < 60) suggestions.push("Consider using more direct language and call-to-actions");

    return {
      wordCount: words,
      readingTime,
      engagementScore,
      suggestions
    };
  };

  const handleGenerate = async () => {
    // Client-side validation
    if (!topic || topic.trim().length < 3) {
      setError("Topic must be at least 3 characters long.");
      return;
    }
    
    if (topic.length > 200) {
      setError("Topic must be 200 characters or less.");
      return;
    }
    
    if (duration < 1 || duration > 60) {
      setError("Duration must be between 1 and 60 minutes.");
      return;
    }

    setLoading(true);
    setError(null);
    setScript("");
    setScriptSections(null);
    setProgress(0);
    setIsCached(false);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      // Ensure proper data types
      const requestBody = {
        topic: topic.trim(),
        videoType,
        duration: Number(duration), // Ensure it's a number
        tone,
        platform,
        targetAudience: targetAudience.trim() || undefined,
        keywords: keywords.trim() || undefined,
        includeHook,
        includeCTA
      };



      const res = await fetch("/api/ai/video-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const data: unknown = await res.json();
      
      if (res.status === 429) {
        // Handle rate limiting
        const rateLimitData = data as { error: string; reset?: Date; remaining?: number };
        const resetTime = rateLimitData.reset ? new Date(rateLimitData.reset).toLocaleTimeString() : "a few minutes";
        setError(`Rate limit exceeded. Please try again after ${resetTime}. ${rateLimitData.remaining ?? 0} requests remaining.`);
        return;
      }
      
            if (res.ok && typeof data === "object" && data !== null && "script" in data) {
        const responseData = data as ScriptResponse & { cached?: boolean };
        const scriptData = responseData.script;
        const fullScript = scriptData.fullScript ?? "No script generated";
        setScript(fullScript);
        setScriptSections({
          title: scriptData.title ?? "",
          hook: scriptData.hook ?? "",
          introduction: scriptData.introduction ?? "",
          mainContent: scriptData.mainContent ?? "",
          conclusion: scriptData.conclusion ?? "",
          callToAction: scriptData.callToAction ?? "",
          technicalNotes: scriptData.technicalNotes ?? ""
        });
        setAnalysis(analyzeScript(fullScript));
        setIsCached(responseData.cached ?? false);
      } else {
        const errorData = data as { error?: string; type?: string; details?: Array<{ message: string; path: string[] }> };
        let errorMessage = "Failed to generate script";
        
        if (errorData.type === "quota_error") {
          errorMessage = "AI quota exceeded. Please upgrade your plan or try again later.";
        } else if (errorData.type === "validation_error") {
          if (errorData.details && errorData.details.length > 0) {
            // Show specific validation errors
            const validationErrors = errorData.details.map(detail => detail.message).join(", ");
            errorMessage = `Validation error: ${validationErrors}`;
          } else {
            errorMessage = "Invalid input. Please check your parameters and try again.";
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        setError(errorMessage);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setProgress(0);
    }
  };

  const copyToClipboard = async (text: string = script) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const saveScript = () => {
    if (script && !savedScripts.includes(script)) {
      setSavedScripts([...savedScripts, script]);
    }
  };

  const downloadScript = (format: 'txt' | 'json') => {
    if (!script) return;
    
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'txt') {
      content = script;
      filename = `video-script-${Date.now()}.txt`;
      mimeType = 'text/plain';
    } else {
      content = JSON.stringify({
        topic,
        videoType,
        duration,
        tone,
        platform,
        script,
        sections: scriptSections,
        analysis,
        generatedAt: new Date().toISOString()
      }, null, 2);
      filename = `video-script-${Date.now()}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadTemplate = (template: typeof SCRIPT_TEMPLATES[0]) => {
    setTopic(template.example);
    setVideoType(template.id === "tutorial" ? "tutorial" : template.id === "review" ? "educational" : "educational");
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4 p-2 rounded-full bg-primary/10 border border-primary/20">
            <div className="p-2 rounded-full bg-primary/20">
              <Video className="size-6 text-primary" />
            </div>
            <span className="text-sm font-medium text-primary">AI-Powered Script Generation</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4 tracking-tight">
            Video Script Generator
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
            Create engaging, platform-optimized video scripts with advanced AI assistance and professional storytelling frameworks
          </p>
          <div className="flex items-center justify-center gap-8 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Platform-Optimized</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span>Professional Quality</span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 h-14 p-1 bg-muted/50 backdrop-blur-sm border border-border/50">
              <TabsTrigger 
                value="generate" 
                className="flex items-center gap-2 h-full px-6 text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Sparkles className="size-4" />
                <span className="hidden sm:inline">Generate</span>
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="flex items-center gap-2 h-full px-6 text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <BookOpen className="size-4" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger 
                value="advanced" 
                className="flex items-center gap-2 h-full px-6 text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Settings className="size-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-2 h-full px-6 text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <History className="size-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Input Form */}
              <div className="lg:col-span-2">
                <Card className="group shadow-xl border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                        <Video className="size-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Script Configuration
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                          Customize your video script parameters for optimal results
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="topic" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <Target className="size-4 text-primary" />
                        Video Topic
                      </Label>
                      <div className="relative">
                        <Textarea
                          id="topic"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="Describe your video topic in detail. The more specific, the better the script!"
                          rows={4}
                          className="resize-none border-2 focus:border-primary transition-all duration-200 bg-background/50 backdrop-blur-sm focus:bg-background hover:border-primary/70"
                          disabled={loading}
                        />
                        <div className="absolute bottom-3 right-3">
                          <div className={`text-xs px-2 py-1 rounded-full transition-colors ${
                            topic.length < 3 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            topic.length < 20 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            topic.length > 180 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {topic.length}/200
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full transition-colors ${
                            topic.length < 3 ? 'bg-red-500' :
                            topic.length < 20 ? 'bg-yellow-500' :
                            topic.length > 180 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}></div>
                          <span className="text-muted-foreground">
                            {topic.length < 3 ? "Minimum 3 characters required" :
                             topic.length < 20 ? "Add more detail for better results" :
                             topic.length > 180 ? "Consider shortening for clarity" :
                             "Perfect detail level"}
                          </span>
                        </div>
                        <Progress 
                          value={(topic.length / 200) * 100} 
                          className="w-20 h-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-foreground">Video Type</Label>
                        <Select value={videoType} onValueChange={(value: typeof videoType) => setVideoType(value)}>
                          <SelectTrigger className="border-2 focus:border-primary transition-all duration-200 bg-background/50 backdrop-blur-sm hover:border-primary/70 h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="backdrop-blur-sm">
                            <SelectItem value="educational" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">📚</span>
                                <div>
                                  <div className="font-medium">Educational</div>
                                  <div className="text-xs text-muted-foreground">Teaching & Learning</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="tutorial" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">🛠️</span>
                                <div>
                                  <div className="font-medium">Tutorial</div>
                                  <div className="text-xs text-muted-foreground">Step-by-step guides</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="explainer" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">💡</span>
                                <div>
                                  <div className="font-medium">Explainer</div>
                                  <div className="text-xs text-muted-foreground">Concept breakdown</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="promotional" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">📢</span>
                                <div>
                                  <div className="font-medium">Promotional</div>
                                  <div className="text-xs text-muted-foreground">Marketing & Sales</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="entertainment" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">🎭</span>
                                <div>
                                  <div className="font-medium">Entertainment</div>
                                  <div className="text-xs text-muted-foreground">Fun & Engaging</div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-foreground">Platform</Label>
                        <Select value={platform} onValueChange={(value: typeof platform) => setPlatform(value)}>
                          <SelectTrigger className="border-2 focus:border-primary transition-all duration-200 bg-background/50 backdrop-blur-sm hover:border-primary/70 h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="backdrop-blur-sm">
                            <SelectItem value="youtube" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">🎥</span>
                                <div>
                                  <div className="font-medium">YouTube</div>
                                  <div className="text-xs text-muted-foreground">Long-form content</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="tiktok" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">🎵</span>
                                <div>
                                  <div className="font-medium">TikTok</div>
                                  <div className="text-xs text-muted-foreground">Short & viral</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="instagram" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">📸</span>
                                <div>
                                  <div className="font-medium">Instagram</div>
                                  <div className="text-xs text-muted-foreground">Visual storytelling</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="general" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">📱</span>
                                <div>
                                  <div className="font-medium">General</div>
                                  <div className="text-xs text-muted-foreground">Multi-platform</div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                          <Clock className="size-4 text-primary" />
                          Duration (minutes)
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            max={60}
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
                            className="border-2 focus:border-primary transition-all duration-200 bg-background/50 backdrop-blur-sm hover:border-primary/70 h-12 pr-16"
                            disabled={loading}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            min
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Progress value={(duration / 60) * 100} className="flex-1 h-1" />
                          <span>{duration}/60</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-foreground">Tone</Label>
                        <Select value={tone} onValueChange={(value: typeof tone) => setTone(value)}>
                          <SelectTrigger className="border-2 focus:border-primary transition-all duration-200 bg-background/50 backdrop-blur-sm hover:border-primary/70 h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="backdrop-blur-sm">
                            <SelectItem value="professional" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">👔</span>
                                <div>
                                  <div className="font-medium">Professional</div>
                                  <div className="text-xs text-muted-foreground">Authoritative & credible</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="casual" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">😊</span>
                                <div>
                                  <div className="font-medium">Casual</div>
                                  <div className="text-xs text-muted-foreground">Friendly & approachable</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="energetic" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">⚡</span>
                                <div>
                                  <div className="font-medium">Energetic</div>
                                  <div className="text-xs text-muted-foreground">Dynamic & exciting</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="calm" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">😌</span>
                                <div>
                                  <div className="font-medium">Calm</div>
                                  <div className="text-xs text-muted-foreground">Soothing & peaceful</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="humorous" className="h-12 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">😄</span>
                                <div>
                                  <div className="font-medium">Humorous</div>
                                  <div className="text-xs text-muted-foreground">Fun & entertaining</div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {loading && (
                      <div className="space-y-4 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/20 animate-pulse">
                            <Sparkles className="size-5 text-primary animate-spin" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm font-medium">
                              <span className="text-primary">Generating your script...</span>
                              <span className="text-primary font-bold">{progress}%</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {progress < 30 ? "Analyzing your topic..." :
                               progress < 60 ? "Applying platform optimization..." :
                               progress < 90 ? "Crafting engaging content..." :
                               "Finalizing your script..."}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Progress value={progress} className="h-3 bg-primary/10" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Processing</span>
                            <span>Almost ready</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-destructive text-sm">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="font-medium mb-1">Generation Error</div>
                            <div>{error}</div>
                            {error.includes("validation") && (
                              <div className="mt-2 text-xs">
                                <strong>Common fixes:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  <li>Ensure topic is 3-200 characters long</li>
                                  <li>Check duration is between 1-60 minutes</li>
                                  <li>Verify all required fields are filled</li>
                                </ul>
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleGenerate}>
                            <RefreshCw className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-6">
                    <Button
                      onClick={handleGenerate}
                      disabled={loading || topic.length < 10}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                      size="lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      {loading ? (
                        <>
                          <Loader2 className="mr-3 size-6 animate-spin" /> 
                          <span>Generating Amazing Content...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="mr-3 size-6 group-hover:scale-110 transition-transform duration-200" />
                          <span>Generate Professional Script</span>
                        </>
                      )}
                    </Button>
                    {topic.length < 10 && (
                      <div className="mt-3 text-center">
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                          <span>Add more detail to your topic to enable generation</span>
                        </div>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              </div>

              {/* Platform Guidelines */}
              <div className="space-y-6">
                <Card className="border-0 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
                        <TrendingUp className="size-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Platform Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {platform === "youtube" && (
                      <div className="space-y-3">
                        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          🎥 YouTube Optimized
                        </Badge>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Algorithm Tips:</div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Hook viewers in first 15 seconds</li>
                            <li>• Pattern interrupts every 30 seconds</li>
                            <li>• Include timestamp suggestions</li>
                            <li>• Optimize for watch time retention</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Content Structure:</div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Preview-Proof-Payoff framework</li>
                            <li>• Clear verbal and visual CTAs</li>
                            <li>• Thumbnail-worthy moments</li>
                            <li>• Chapter-ready organization</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {platform === "tiktok" && (
                      <div className="space-y-3">
                        <Badge variant="secondary" className="bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100">
                          🎵 TikTok Optimized
                        </Badge>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Engagement Tips:</div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• 3-second pattern interrupt hook</li>
                            <li>• Jump cuts every 2-3 seconds</li>
                            <li>• Trending audio suggestions</li>
                            <li>• Text overlay opportunities</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Viral Elements:</div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Problem-Agitation-Solution format</li>
                            <li>• Scroll-stopping moments</li>
                            <li>• Strong next video hook</li>
                            <li>• Hashtag optimization</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {platform === "instagram" && (
                      <div className="space-y-3">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                          📸 Instagram Optimized
                        </Badge>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Visual Strategy:</div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Vertical-first storytelling</li>
                            <li>• Caption-worthy quotes</li>
                            <li>• Story highlight potential</li>
                            <li>• Aesthetic visual sequences</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Engagement:</div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• AIDA framework integration</li>
                            <li>• Interactive elements (polls, Q&A)</li>
                            <li>• Shareable moments design</li>
                            <li>• Save-worthy content</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {platform === "general" && (
                      <div className="space-y-3">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          📱 Multi-Platform Ready
                        </Badge>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Universal Principles:</div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Adaptable content structure</li>
                            <li>• Platform-agnostic storytelling</li>
                            <li>• Flexible timing formats</li>
                            <li>• Cross-platform optimization</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Adaptation Notes:</div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Multiple format variations</li>
                            <li>• Scalable engagement tactics</li>
                            <li>• Universal value delivery</li>
                            <li>• Cross-platform CTAs</li>
                          </ul>
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>

                {/* Tone Guidelines */}
                <Card className="border-0 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20">
                        <span className="text-lg">🎭</span>
                      </div>
                      Tone Guidance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tone === "professional" && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                          👔 Professional Tone
                        </Badge>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Authoritative but approachable language</li>
                          <li>• Industry-specific terminology</li>
                          <li>• Fact-based credibility markers</li>
                          <li>• Confident, declarative statements</li>
                        </ul>
                      </div>
                    )}
                    {tone === "casual" && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100">
                          😊 Casual Tone
                        </Badge>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Conversational, friend-to-friend style</li>
                          <li>• Personal anecdotes and examples</li>
                          <li>• Contractions and everyday expressions</li>
                          <li>• Intimate, one-on-one feeling</li>
                        </ul>
                      </div>
                    )}
                    {tone === "energetic" && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-100">
                          ⚡ Energetic Tone
                        </Badge>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Dynamic, action-oriented language</li>
                          <li>• Excitement markers and power words</li>
                          <li>• Short, punchy sentences</li>
                          <li>• High energy without overwhelming</li>
                        </ul>
                      </div>
                    )}
                    {tone === "calm" && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-100">
                          😌 Calm Tone
                        </Badge>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Soothing, reassuring language</li>
                          <li>• Mindful pauses and breathing moments</li>
                          <li>• Peaceful, stress-free atmosphere</li>
                          <li>• Steady pacing without rushing</li>
                        </ul>
                      </div>
                    )}
                    {tone === "humorous" && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100">
                          😄 Humorous Tone
                        </Badge>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Well-timed jokes and wit</li>
                          <li>• Playful language and comparisons</li>
                          <li>• Self-deprecating humor when appropriate</li>
                          <li>• Balance humor with valuable content</li>
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {analysis && (
                  <Card className="border-0 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-900/20 dark:to-emerald-800/10 backdrop-blur-sm shadow-lg border border-emerald-200/50 dark:border-emerald-800/30">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
                          <Target className="size-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Script Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-primary">{analysis.wordCount}</div>
                          <div className="text-xs text-muted-foreground">Words</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-primary">{analysis.readingTime}m</div>
                          <div className="text-xs text-muted-foreground">Read Time</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Engagement Score</span>
                          <span className="font-medium">{analysis.engagementScore}%</span>
                        </div>
                        <Progress value={analysis.engagementScore} className="h-2" />
                      </div>
                      
                      {analysis.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Suggestions:</div>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            {analysis.suggestions.map((suggestion, index) => (
                              <li key={index}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Generated Script Display */}
            {script && (
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 group animate-in slide-in-from-bottom-4 duration-700">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 group-hover:scale-110 transition-transform duration-300">
                        <FileText className="size-7 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl font-bold flex items-center gap-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Generated Script
                          {isCached && (
                            <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900 dark:to-blue-800 dark:text-blue-100 border border-blue-300 dark:border-blue-700">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                <span>⚡ Cached</span>
                              </div>
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                          {isCached 
                            ? "Retrieved from cache for faster response" 
                            : "Your AI-generated video script is ready for production"
                          }
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={saveScript}
                        className="h-10 px-4 bg-background/50 hover:bg-background border-2 hover:border-primary/50 transition-all duration-200 group"
                      >
                        <Save className="size-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadScript('txt')}
                        className="h-10 px-4 bg-background/50 hover:bg-background border-2 hover:border-primary/50 transition-all duration-200 group"
                      >
                        <Download className="size-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToClipboard()}
                        className={`h-10 px-4 bg-background/50 hover:bg-background border-2 transition-all duration-200 group ${
                          copied ? 'border-green-500 text-green-600' : 'hover:border-primary/50'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="size-4 mr-2 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="size-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {scriptSections ? (
                    <Tabs defaultValue="full" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-7">
                        <TabsTrigger value="full">Full Script</TabsTrigger>
                        <TabsTrigger value="hook">Hook</TabsTrigger>
                        <TabsTrigger value="intro">Intro</TabsTrigger>
                        <TabsTrigger value="main">Main</TabsTrigger>
                        <TabsTrigger value="conclusion">Conclusion</TabsTrigger>
                        <TabsTrigger value="cta">CTA</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="full">
                        <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-muted-foreground/20">
                          <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                            {script}
                          </pre>
                        </div>
                      </TabsContent>
                      
                                             {Object.entries(scriptSections).map(([key, content]) => {
                         if (key === "title" || !content) return null;
                         const contentString = content as string;
                         return (
                           <TabsContent key={key} value={key === "mainContent" ? "main" : key === "callToAction" ? "cta" : key === "technicalNotes" ? "notes" : key === "introduction" ? "intro" : key}>
                             <div className="space-y-2">
                               <div className="flex justify-between items-center">
                                 <h3 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                                 <Button variant="ghost" size="sm" onClick={() => copyToClipboard(contentString)}>
                                   <Copy className="size-4" />
                                 </Button>
                               </div>
                               <div className="bg-muted/30 rounded-lg p-4 border border-muted-foreground/20">
                                 <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                   {contentString}
                                 </pre>
                               </div>
                             </div>
                           </TabsContent>
                         );
                       })}
                    </Tabs>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-muted-foreground/20">
                      <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {script}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card className="border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="size-5" />
                  Script Templates
                </CardTitle>
                <CardDescription>
                  Quick start with proven video script formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {SCRIPT_TEMPLATES.map((template) => (
                    <Card key={template.id} className="border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => loadTemplate(template)}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{template.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                        <div className="text-xs bg-muted/50 rounded p-2 font-mono">
                          {template.example}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="size-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>
                  Fine-tune your script generation with advanced options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="audience" className="text-sm font-medium flex items-center gap-2">
                        <Users className="size-4" />
                        Target Audience
                      </Label>
                      <Input
                        id="audience"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="e.g., Small business owners, Students, Developers"
                        className="border-2 focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="keywords" className="text-sm font-medium">
                        Focus Keywords
                      </Label>
                      <Input
                        id="keywords"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="e.g., productivity, marketing, AI tools"
                        className="border-2 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Include Hook</Label>
                        <p className="text-xs text-muted-foreground">Add attention-grabbing opening</p>
                      </div>
                      <Switch checked={includeHook} onCheckedChange={setIncludeHook} />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Include Call-to-Action</Label>
                        <p className="text-xs text-muted-foreground">Add engagement prompts</p>
                      </div>
                      <Switch checked={includeCTA} onCheckedChange={setIncludeCTA} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-5" />
                  Saved Scripts
                </CardTitle>
                <CardDescription>
                  Access your previously generated scripts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedScripts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="size-12 mx-auto mb-4 opacity-50" />
                    <p>No saved scripts yet</p>
                    <p className="text-sm">Generate and save scripts to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedScripts.map((savedScript, index) => (
                      <Card key={index} className="border hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm line-clamp-3">{savedScript.substring(0, 200)}...</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(savedScript)}>
                                <Copy className="size-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setScript(savedScript)}>
                                Load
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}