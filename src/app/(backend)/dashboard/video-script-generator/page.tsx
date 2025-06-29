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

/**
 * VideoScriptGenerator component
 *
 * This component provides a user interface for generating, customizing, and managing video scripts.
 * Users can configure script parameters, select templates, view advanced settings, and access saved scripts.
 *
 * @component
 */
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

  /**
   * Analyzes a script to provide metrics and suggestions for improvement.
   *
   * This function calculates the word count, reading time, average words per sentence,
   * and engagement score based on various factors such as presence of questions, direct address,
   * sentence length, and punctuation. It also generates suggestions for enhancing the script's
   * readability and engagement.
   */
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

  /**
   * Handles the generation of a video script by sending a request to the server and updating the UI based on the response.
   *
   * This function sets loading state, clears previous errors, and resets script data before initiating a network request.
   * It simulates progress by incrementally updating the progress bar. Upon successful response, it processes the script
   * data and updates the UI accordingly. In case of an error, it sets an appropriate error message. Finally, it ensures
   * the loading state is reset regardless of the outcome.
   *
   * @returns A promise that resolves when the network request completes.
   */
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setScript("");
    setScriptSections(null);
    setProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const res = await fetch("/api/ai/video-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic, 
          videoType, 
          duration, 
          tone, 
          platform,
          targetAudience,
          keywords,
          includeHook,
          includeCTA
        }),
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      const data: unknown = await res.json();
      if (res.ok && typeof data === "object" && data !== null && "script" in data) {
        const scriptData = (data as ScriptResponse).script;
        const fullScript = scriptData.fullScript || "No script generated";
        setScript(fullScript);
        setScriptSections({
          title: scriptData.title || "",
          hook: scriptData.hook || "",
          introduction: scriptData.introduction || "",
          mainContent: scriptData.mainContent || "",
          conclusion: scriptData.conclusion || "",
          callToAction: scriptData.callToAction || "",
          technicalNotes: scriptData.technicalNotes || ""
        });
        setAnalysis(analyzeScript(fullScript));
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
      clearInterval(progressInterval);
      setLoading(false);
      setProgress(0);
    }
  };

  /**
   * Copies the given text to the clipboard and sets a copied state.
   */
  const copyToClipboard = async (text: string = script) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  /**
   * Saves the current script to the saved scripts list if it exists and is not already saved.
   */
  const saveScript = () => {
    if (script && !savedScripts.includes(script)) {
      setSavedScripts([...savedScripts, script]);
    }
  };

  /**
   * Downloads the script in either 'txt' or 'json' format.
   */
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

  /**
   * Sets topic and video type based on the provided template.
   */
  const loadTemplate = (template: typeof SCRIPT_TEMPLATES[0]) => {
    setTopic(template.example);
    setVideoType(template.id === "tutorial" ? "tutorial" : template.id === "review" ? "educational" : "educational");
  };

  /**
   * Retrieves the icon associated with a given platform.
   *
   * This function uses a switch statement to match the input platform string
   * against predefined cases and returns the corresponding icon emoji.
   * If the platform does not match any known case, it defaults to returning "📱".
   *
   * @param platform - The name of the platform for which to retrieve the icon.
   */
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube": return "🎥";
      case "tiktok": return "🎵";
      case "instagram": return "📸";
      default: return "📱";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            AI Video Script Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Create engaging, platform-optimized video scripts with advanced AI assistance
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="size-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="size-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="size-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="size-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Input Form */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Video className="size-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Script Configuration</CardTitle>
                        <CardDescription>
                          Customize your video script parameters for optimal results
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="topic" className="text-sm font-medium flex items-center gap-2">
                        <Target className="size-4" />
                        Video Topic
                      </Label>
                      <Textarea
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Describe your video topic in detail. The more specific, the better the script!"
                        rows={4}
                        className="resize-none border-2 focus:border-primary/50 transition-colors"
                        disabled={loading}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{topic.length} characters</span>
                        <span>{topic.length < 20 ? "Add more detail for better results" : "Good detail level"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Video Type</Label>
                        <Select value={videoType} onValueChange={(value: typeof videoType) => setVideoType(value)}>
                          <SelectTrigger className="border-2 focus:border-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="educational">📚 Educational</SelectItem>
                            <SelectItem value="tutorial">🛠️ Tutorial</SelectItem>
                            <SelectItem value="explainer">💡 Explainer</SelectItem>
                            <SelectItem value="promotional">📢 Promotional</SelectItem>
                            <SelectItem value="entertainment">🎭 Entertainment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Platform</Label>
                        <Select value={platform} onValueChange={(value: typeof platform) => setPlatform(value)}>
                          <SelectTrigger className="border-2 focus:border-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="youtube">{getPlatformIcon("youtube")} YouTube</SelectItem>
                            <SelectItem value="tiktok">{getPlatformIcon("tiktok")} TikTok</SelectItem>
                            <SelectItem value="instagram">{getPlatformIcon("instagram")} Instagram</SelectItem>
                            <SelectItem value="general">{getPlatformIcon("general")} General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Clock className="size-4" />
                          Duration (minutes)
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          value={duration}
                          onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
                          className="border-2 focus:border-primary/50"
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tone</Label>
                        <Select value={tone} onValueChange={(value: typeof tone) => setTone(value)}>
                          <SelectTrigger className="border-2 focus:border-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">👔 Professional</SelectItem>
                            <SelectItem value="casual">😊 Casual</SelectItem>
                            <SelectItem value="energetic">⚡ Energetic</SelectItem>
                            <SelectItem value="calm">😌 Calm</SelectItem>
                            <SelectItem value="humorous">😄 Humorous</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {loading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Generating your script...</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {error && (
                      <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-destructive text-sm flex items-center gap-2">
                        <div className="flex-1">{error}</div>
                        <Button variant="ghost" size="sm" onClick={handleGenerate}>
                          <RefreshCw className="size-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handleGenerate}
                      disabled={loading || topic.length < 10}
                      className="w-full h-12 text-lg"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 size-5 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 size-5" />
                          Generate Script
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Platform Guidelines */}
              <div className="space-y-4">
                <Card className="border-0 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="size-5" />
                      Platform Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {platform === "youtube" && (
                      <div className="space-y-2">
                        <Badge variant="secondary">YouTube Optimized</Badge>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Hook viewers in first 15 seconds</li>
                          <li>• Include clear call-to-actions</li>
                          <li>• Structure for longer attention spans</li>
                          <li>• Optimize for search keywords</li>
                        </ul>
                      </div>
                    )}
                    {platform === "tiktok" && (
                      <div className="space-y-2">
                        <Badge variant="secondary">TikTok Optimized</Badge>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Quick, punchy opening</li>
                          <li>• Trend-aware content</li>
                          <li>• Visual storytelling focus</li>
                          <li>• Immediate value delivery</li>
                        </ul>
                      </div>
                    )}
                    {platform === "instagram" && (
                      <div className="space-y-2">
                        <Badge variant="secondary">Instagram Optimized</Badge>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Visual-first narrative</li>
                          <li>• Lifestyle-focused tone</li>
                          <li>• Story-driven content</li>
                          <li>• Community engagement</li>
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {analysis && (
                  <Card className="border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="size-5" />
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
              <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <FileText className="size-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Generated Script</CardTitle>
                        <CardDescription>Your AI-generated video script is ready</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={saveScript}>
                        <Save className="size-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadScript('txt')}>
                        <Download className="size-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard()}>
                        {copied ? (
                          <>
                            <Check className="size-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="size-4 mr-2" />
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