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
import { Loader2, Languages, Copy, RotateCcw, ArrowRightLeft, Globe, CheckCircle2, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const translationFormSchema = z.object({
  text: z.string().min(1, "Text is required").max(5000, "Text is too long"),
  sourceLanguage: z.string().default("auto"),
  targetLanguage: z.string().min(1, "Please select a target language"),
  style: z.enum(["formal", "informal", "social", "professional", "casual"]).default("social"),
  context: z.enum(["general", "social-media", "business", "customer-service", "marketing"]).default("social-media"),
  tone: z.enum(["maintain", "friendly", "professional", "enthusiastic", "neutral"]).default("maintain"),
  includeAlternatives: z.boolean().default(false),
});

type TranslationFormValues = z.infer<typeof translationFormSchema>;

interface TranslationResult {
  primaryTranslation: string;
  alternatives: string[];
  detectedSourceLanguage: string;
  translationNotes: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  targetLanguageName: string;
  style: string;
  context: string;
  tone: string;
  characterCount: number;
  wordCount: number;
}

const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'tr': 'Turkish',
  'pl': 'Polish',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'id': 'Indonesian',
  'ms': 'Malay',
  'he': 'Hebrew',
  'fa': 'Persian',
  'ur': 'Urdu',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu',
  'sw': 'Swahili',
  'af': 'Afrikaans',
  'ca': 'Catalan',
};

const STYLE_OPTIONS = [
  { value: 'formal', label: 'Formal', description: 'Professional and respectful tone' },
  { value: 'informal', label: 'Informal', description: 'Casual and conversational' },
  { value: 'social', label: 'Social Media', description: 'Engaging and shareable' },
  { value: 'professional', label: 'Professional', description: 'Business-appropriate language' },
  { value: 'casual', label: 'Casual', description: 'Relaxed everyday language' },
];

const CONTEXT_OPTIONS = [
  { value: 'general', label: 'General', description: 'General purpose translation' },
  { value: 'social-media', label: 'Social Media', description: 'Optimized for social platforms' },
  { value: 'business', label: 'Business', description: 'Professional communication' },
  { value: 'customer-service', label: 'Customer Service', description: 'Helpful and polite' },
  { value: 'marketing', label: 'Marketing', description: 'Persuasive and engaging' },
];

const TONE_OPTIONS = [
  { value: 'maintain', label: 'Maintain Original', description: 'Keep the original tone' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'professional', label: 'Professional', description: 'Competent and authoritative' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Positive and energetic' },
  { value: 'neutral', label: 'Neutral', description: 'Balanced and objective' },
];

/**
 * A React component representing a language translation page with advanced settings and features.
 *
 * This component manages state for loading, results, copied texts, and character count. It uses a form to collect user input,
 * including text to translate and various translation options such as source and target languages, style, context, tone,
 * and whether to include alternative translations. The component handles form submission by sending the data to an API
 * endpoint for processing and displaying the results. It also includes functionality to copy translated text to the clipboard,
 * swap language directions, and reset the form.
 *
 * @returns A React JSX element representing the Language Translator page.
 */
export default function LanguageTranslatorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TranslationResult | null>(null);
  const [copiedTexts, setCopiedTexts] = useState<Set<string>>(new Set());
  const [charCount, setCharCount] = useState(0);

  const form = useForm<TranslationFormValues>({
    resolver: zodResolver(translationFormSchema),
    defaultValues: {
      text: "",
      sourceLanguage: "auto",
      targetLanguage: "",
      style: "social",
      context: "social-media",
      tone: "maintain",
      includeAlternatives: false,
    },
  });

  const watchedText = form.watch("text");

  useEffect(() => {
    setCharCount(watchedText?.length ?? 0);
  }, [watchedText]);

  /**
   * Handles form submission by translating text using an API and updating the UI with the results.
   *
   * It first sets loading state, then sends a POST request to the translation API with the form values.
   * If the response is successful, it processes the translated data and updates the results state.
   * On failure, it logs the error and shows an error notification.
   * Finally, it resets the loading state regardless of the outcome.
   *
   * @param values - An object containing the form values to be translated.
   */
  const onSubmit = async (values: TranslationFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error ?? "Failed to translate text");
      }

      const data = await response.json() as TranslationResult;
      setResults(data);
      
      toast.success("Translation completed!", {
        description: `Translated to ${data.targetLanguageName}`,
        icon: <CheckCircle2 className="size-4" />,
      });
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Translation failed", {
        description: error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copies text to clipboard and updates copied texts set with a timeout.
   */
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

  /**
   * Swaps the values of targetLanguage and sourceLanguage in the form if both are set and sourceLanguage is not "auto".
   */
  const swapLanguages = () => {
    const currentTarget = form.getValues("targetLanguage");
    const currentSource = form.getValues("sourceLanguage");
    
    if (currentTarget && currentSource !== "auto") {
      form.setValue("targetLanguage", currentSource);
      form.setValue("sourceLanguage", currentTarget);
    }
  };

  /**
   * Resets the form and clears results and character count.
   */
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
            <Languages className="size-8 text-primary" />
            Language Translator
          </h1>
          <p className="text-muted-foreground">
            Translate text between languages with AI-powered context awareness
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
              <Globe className="size-5" />
              Translation Settings
            </CardTitle>
            <CardDescription>
              Configure your translation preferences and enter text to translate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Language Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sourceLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Language</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Auto-detect" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="auto">Auto-detect</SelectItem>
                            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                              <SelectItem key={code} value={code}>
                                {name}
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
                    name="targetLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          To Language
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={swapLanguages}
                            className="p-1 h-auto"
                          >
                            <ArrowRightLeft className="size-4" />
                          </Button>
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                              <SelectItem key={code} value={code}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Translation Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Style</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STYLE_OPTIONS.map((option) => (
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
                    name="context"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Context</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONTEXT_OPTIONS.map((option) => (
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
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tone</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TONE_OPTIONS.map((option) => (
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

                {/* Include Alternatives Switch */}
                <FormField
                  control={form.control}
                  name="includeAlternatives"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Alternative Translations</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Generate multiple translation options
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
                        Text to Translate
                        <span className="text-sm text-muted-foreground">
                          {charCount}/5000
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the text you want to translate..."
                          className="min-h-[120px] resize-none"
                          maxLength={5000}
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
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="mr-2 size-4" />
                      Translate
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
              <RefreshCw className="size-5" />
              Translation Results
            </CardTitle>
            <CardDescription>
              {results ? `Translated to ${results.targetLanguageName}` : "Translation results will appear here"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-6">
                {/* Primary Translation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Primary Translation</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{results.wordCount} words</Badge>
                      <Badge variant="outline">{results.characterCount} chars</Badge>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <p className="whitespace-pre-wrap">{results.primaryTranslation}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => copyToClipboard(results.primaryTranslation, "Translation")}
                    >
                      {copiedTexts.has(results.primaryTranslation) ? (
                        <CheckCircle2 className="size-4 text-green-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Alternative Translations */}
                {results.alternatives.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Alternative Translations</h3>
                    <div className="space-y-3">
                      {results.alternatives.map((alt, index) => (
                        <div key={index} className="relative">
                          <div className="rounded-lg border bg-muted/30 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="mb-1 text-sm font-medium text-muted-foreground">
                                  Alternative {index + 1}
                                </div>
                                <p className="whitespace-pre-wrap">{alt}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(alt, `Alternative ${index + 1}`)}
                              >
                                {copiedTexts.has(alt) ? (
                                  <CheckCircle2 className="size-4 text-green-600" />
                                ) : (
                                  <Copy className="size-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Translation Notes */}
                {results.translationNotes && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Translation Notes</h3>
                    <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {results.translationNotes}
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Translation Details */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Translation Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Style:</span>
                      <Badge variant="outline" className="ml-2">
                        {results.style}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Context:</span>
                      <Badge variant="outline" className="ml-2">
                        {results.context}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tone:</span>
                      <Badge variant="outline" className="ml-2">
                        {results.tone}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Target:</span>
                      <Badge variant="outline" className="ml-2">
                        {results.targetLanguageName}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Languages className="size-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Enter text and configure your translation settings to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 