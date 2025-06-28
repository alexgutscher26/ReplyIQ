"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, 
  Brain, 
  Copy, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Heart,
  Frown,
  Angry,
  Zap,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Shield
} from "lucide-react";
import { useToolTracker } from "@/utils/track-tool-usage";

const sentimentFormSchema = z.object({
  text: z.string().min(1, "Text is required").max(10000, "Text is too long"),
  platform: z.enum(["twitter", "facebook", "instagram", "linkedin", "general"]).default("general"),
  analysisType: z.enum(["quick", "detailed", "comprehensive"]).default("detailed"),
  includeRecommendations: z.boolean().default(true),
});

type SentimentFormValues = z.infer<typeof sentimentFormSchema>;

interface SentimentResult {
  overallSentiment: string;
  sentimentConfidence: number;
  primaryEmotion: string;
  secondaryEmotions: string[];
  toneIndicators: string[];
  intensityLevel: string;
  intensityScore: number;
  contextClues: string;
  potentialTriggers: string[];
  audienceConsideration: string;
  responseRecommendations: {
    toneToUse: string;
    keyPoints: string[];
    avoid: string[];
    strategy: string;
  };
  analysisNotes: string;
  fullResponse: string;
  riskFlags: string[];
  originalText: string;
  platform: string;
  analysisType: string;
  wordCount: number;
  characterCount: number;
  timestamp: string;
}

const PLATFORM_OPTIONS = [
  { value: 'general', label: 'General', description: 'General social media context' },
  { value: 'twitter', label: 'Twitter/X', description: 'Character limits and public discourse' },
  { value: 'facebook', label: 'Facebook', description: 'Personal and community interactions' },
  { value: 'instagram', label: 'Instagram', description: 'Visual content and lifestyle focus' },
  { value: 'linkedin', label: 'LinkedIn', description: 'Professional networking platform' },
];

const ANALYSIS_OPTIONS = [
  { value: 'quick', label: 'Quick Analysis', description: 'Brief overview with main emotion' },
  { value: 'detailed', label: 'Detailed Analysis', description: 'Comprehensive emotion and tone analysis' },
  { value: 'comprehensive', label: 'Comprehensive', description: 'In-depth analysis with cultural context' },
];

const getSentimentIcon = (sentiment: string) => {
  const lowerSentiment = sentiment.toLowerCase();
  if (lowerSentiment.includes('positive')) return <TrendingUp className="size-5 text-green-600" />;
  if (lowerSentiment.includes('negative')) return <TrendingDown className="size-5 text-red-600" />;
  return <Minus className="size-5 text-gray-600" />;
};

const getSentimentColor = (sentiment: string) => {
  const lowerSentiment = sentiment.toLowerCase();
  if (lowerSentiment.includes('positive')) return 'text-green-600 bg-green-50 border-green-200';
  if (lowerSentiment.includes('negative')) return 'text-red-600 bg-red-50 border-red-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
};

const getEmotionIcon = (emotion: string) => {
  const lowerEmotion = emotion.toLowerCase();
  if (lowerEmotion.includes('joy') || lowerEmotion.includes('happy')) return <Heart className="size-4 text-pink-500" />;
  if (lowerEmotion.includes('sad') || lowerEmotion.includes('melancholy')) return <Frown className="size-4 text-blue-500" />;
  if (lowerEmotion.includes('anger') || lowerEmotion.includes('angry')) return <Angry className="size-4 text-red-500" />;
  if (lowerEmotion.includes('excitement') || lowerEmotion.includes('excited')) return <Zap className="size-4 text-yellow-500" />;
  return <Eye className="size-4 text-gray-500" />;
};

const getIntensityColor = (score: number) => {
  if (score >= 8) return 'bg-red-500';
  if (score >= 6) return 'bg-orange-500';
  if (score >= 4) return 'bg-yellow-500';
  return 'bg-green-500';
};

export default function SentimentAnalysisPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SentimentResult | null>(null);
  const [copiedTexts, setCopiedTexts] = useState<Set<string>>(new Set());
  const [charCount, setCharCount] = useState(0);
  const { trackTool } = useToolTracker();

  const form = useForm<SentimentFormValues>({
    resolver: zodResolver(sentimentFormSchema),
    defaultValues: {
      text: "",
      platform: "general",
      analysisType: "detailed",
      includeRecommendations: true,
    },
  });

  const watchedText = form.watch("text");

  useEffect(() => {
    setCharCount(watchedText?.length ?? 0);
  }, [watchedText]);

  const onSubmit = async (values: SentimentFormValues) => {
    const startTime = Date.now();
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/ai/sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error ?? "Failed to analyze sentiment");
      }

      const data = await response.json() as SentimentResult;
      setResults(data);
      
      // Track successful usage
      const duration = Date.now() - startTime;
      await trackTool('sentiment-analysis', {
        platform: values.platform,
        analysisType: values.analysisType,
        textLength: values.text.length,
        hasRecommendations: values.includeRecommendations,
        success: true,
      }, duration);
      
      toast.success("Sentiment analysis completed!", {
        description: `Analyzed ${data.wordCount} words with ${data.sentimentConfidence}% confidence`,
        icon: <CheckCircle2 className="size-4" />,
      });
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      
      // Track failed usage
      const duration = Date.now() - startTime;
      await trackTool('sentiment-analysis', {
        platform: values.platform,
        analysisType: values.analysisType,
        textLength: values.text.length,
        hasRecommendations: values.includeRecommendations,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }, duration);
      
      toast.error("Analysis failed", {
        description: error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTexts(prev => new Set(prev).add(text));
      toast.success(`${label} copied!`, {
        icon: <Copy className="size-4" />,
      });
      
      setTimeout(() => {
        setCopiedTexts(prev => {
          const newSet = new Set(prev);
          newSet.delete(text);
          return newSet;
        });
      }, 2000);
    } catch {
      toast.error("Failed to copy text");
    }
  };

  const resetForm = () => {
    form.reset();
    setResults(null);
    setCharCount(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Brain className="size-8 text-primary" />
            Sentiment Analysis
          </h1>
          <p className="text-muted-foreground">
            Analyze emotional tone and sentiment before crafting responses
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetForm}
          className="flex items-center gap-2"
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="size-5" />
              Analysis Settings
            </CardTitle>
            <CardDescription>
              Configure analysis parameters and enter text to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Platform and Analysis Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Context</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PLATFORM_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="analysisType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Analysis Depth</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ANALYSIS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Include Recommendations Switch */}
                <FormField
                  control={form.control}
                  name="includeRecommendations"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Response Recommendations</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Get suggestions for how to respond appropriately
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Text Input */}
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        Text to Analyze
                        <span className="text-sm text-muted-foreground">
                          {charCount}/10000
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the text you want to analyze for sentiment and emotional tone..."
                          className="min-h-[150px] resize-none"
                          maxLength={10000}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 size-4" />
                      Analyze Sentiment
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Analysis Results
            </CardTitle>
            <CardDescription>
              {results ? `Analysis for ${results.platform} context` : "Sentiment analysis results will appear here"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-6">
                {/* Risk Flags */}
                {results.riskFlags.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="size-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Content Warning:</strong> This content may contain sensitive topics.
                      {results.riskFlags.includes('mental-health-concern') && " Consider reaching out with empathy and resources."}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Overall Sentiment */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Overall Sentiment</h3>
                  <div className={`rounded-lg border p-4 ${getSentimentColor(results.overallSentiment)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getSentimentIcon(results.overallSentiment)}
                        <div>
                          <div className="font-medium">{results.overallSentiment}</div>
                          <div className="text-sm opacity-75">Primary Assessment</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{results.sentimentConfidence}%</div>
                        <div className="text-sm opacity-75">Confidence</div>
                      </div>
                    </div>
                    {results.sentimentConfidence > 0 && (
                      <div className="mt-3">
                        <Progress 
                          value={results.sentimentConfidence} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Emotions */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Emotional Analysis</h3>
                  <div className="space-y-3">
                    {/* Primary Emotion */}
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                      <div className="flex items-center gap-2">
                        {getEmotionIcon(results.primaryEmotion)}
                        <span className="font-medium">{results.primaryEmotion}</span>
                        <Badge variant="secondary">Primary</Badge>
                      </div>
                    </div>

                    {/* Secondary Emotions */}
                    {results.secondaryEmotions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Secondary Emotions</div>
                        <div className="flex flex-wrap gap-2">
                          {results.secondaryEmotions.map((emotion, index) => (
                            <div key={index} className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-sm">
                              {getEmotionIcon(emotion)}
                              <span>{emotion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Intensity and Tone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Intensity */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Intensity Level</h3>
                    <div className="p-3 rounded-lg border bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{results.intensityLevel}</span>
                        <span className="text-sm text-muted-foreground">{results.intensityScore}/10</span>
                      </div>
                      {results.intensityScore > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getIntensityColor(results.intensityScore)}`}
                            style={{ width: `${(results.intensityScore / 10) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tone Indicators */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Tone Indicators</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.toneIndicators.map((tone, index) => (
                        <Badge key={index} variant="outline">
                          {tone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Context and Triggers */}
                {(results.contextClues || results.potentialTriggers.length > 0) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Context Analysis</h3>
                    {results.contextClues && (
                      <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                        <div className="text-sm font-medium mb-1">Context Clues</div>
                        <p className="text-sm text-muted-foreground">{results.contextClues}</p>
                      </div>
                    )}
                    
                    {results.potentialTriggers.length > 0 && (
                      <div className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                        <div className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Shield className="size-4" />
                          Potential Triggers
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {results.potentialTriggers.map((trigger, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Response Recommendations */}
                {results.responseRecommendations.toneToUse && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Response Recommendations</h3>
                    <div className="space-y-3">
                      {/* Recommended Tone */}
                      <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                        <div className="text-sm font-medium mb-1">Recommended Tone</div>
                        <p className="text-sm">{results.responseRecommendations.toneToUse}</p>
                      </div>

                      {/* Strategy */}
                      {results.responseRecommendations.strategy && (
                        <div className="p-3 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
                          <div className="text-sm font-medium mb-1">Response Strategy</div>
                          <p className="text-sm">{results.responseRecommendations.strategy}</p>
                        </div>
                      )}

                      {/* Key Points and Avoid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {results.responseRecommendations.keyPoints.length > 0 && (
                          <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                            <div className="text-sm font-medium mb-2">Key Points to Address</div>
                            <ul className="text-sm space-y-1">
                              {results.responseRecommendations.keyPoints.map((point, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {results.responseRecommendations.avoid.length > 0 && (
                          <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                            <div className="text-sm font-medium mb-2">What to Avoid</div>
                            <ul className="text-sm space-y-1">
                              {results.responseRecommendations.avoid.map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-red-500 mt-1">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Notes */}
                {results.analysisNotes && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Additional Insights</h3>
                    <div className="p-3 rounded-lg border bg-muted/50">
                      <p className="text-sm whitespace-pre-wrap">{results.analysisNotes}</p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Analysis Metadata */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Analysis Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Platform:</span>
                      <Badge variant="outline" className="ml-2">
                        {results.platform}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline" className="ml-2">
                        {results.analysisType}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Words:</span>
                      <Badge variant="outline" className="ml-2">
                        {results.wordCount}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Characters:</span>
                      <Badge variant="outline" className="ml-2">
                        {results.characterCount}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Copy Full Analysis */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(results.fullResponse, "Full Analysis")}
                    className="flex items-center gap-2"
                  >
                    {copiedTexts.has(results.fullResponse) ? (
                      <CheckCircle2 className="size-4 text-green-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    Copy Full Analysis
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="size-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Enter text and configure analysis settings to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 