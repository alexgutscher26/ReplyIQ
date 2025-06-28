"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Loader2, ImageIcon, Copy, Check, Upload } from "lucide-react";
import { useUploadThing } from "@/utils/uploadthing";
import Image from "next/image";

interface CaptionResponse {
  caption: string;
  imageUrl: string;
  style: string;
  platform: string;
  includeHashtags: boolean;
}

export default function ImageCaptionGeneratorPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [style, setStyle] = useState<"descriptive" | "creative" | "minimal" | "social" | "professional">("descriptive");
  const [platform, setPlatform] = useState<"instagram" | "facebook" | "twitter" | "linkedin" | "general">("general");
  const [includeHashtags, setIncludeHashtags] = useState(false);
  const [caption, setCaption] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      console.log("Files: ", res);
      if (res?.[0]) {
        setImageUrl(res[0].url);
        setUploading(false);
      }
    },
    onUploadError: (error: Error) => {
      console.log(`ERROR! ${error.message}`);
      setError(`Upload failed: ${error.message}`);
      setUploading(false);
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;
    
    setUploading(true);
    setError(null);
    try {
      await startUpload([selectedImage]);
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!imageUrl) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    setError(null);
    setCaption("");
    
    try {
      const res = await fetch("/api/ai/image-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, style, platform, includeHashtags }),
      });
      
      const data: unknown = await res.json();
      
      if (res.ok && typeof data === "object" && data !== null && "caption" in data) {
        const responseData = data as CaptionResponse;
        setCaption(responseData.caption || "No caption generated");
      } else {
        setError(
          typeof data === "object" && data !== null && "error" in data
            ? ((data as { error?: string }).error ?? "Failed to generate caption")
            : "Failed to generate caption"
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
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImageUrl("");
    setImagePreview("");
    setCaption("");
    setError(null);
    setCopied(false);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10 px-2">
      <div className="grid gap-6 max-w-4xl w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ImageIcon className="size-6 text-primary" />
              <div>
                <CardTitle>Image Caption Generator</CardTitle>
                <CardDescription>
                  Upload an image and generate AI-powered captions for your social media posts.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload Section */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Upload Image
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-fit">
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        width={300} 
                        height={200} 
                        className="rounded-lg object-cover max-h-48"
                      />
                    </div>
                    <div className="flex gap-2 justify-center">
                      {!imageUrl && (
                        <Button 
                          onClick={handleUpload} 
                          disabled={uploading}
                          size="sm"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 size-4" />
                              Upload Image
                            </>
                          )}
                        </Button>
                      )}
                      <Button 
                        onClick={resetForm} 
                        variant="outline" 
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                    {imageUrl && (
                      <p className="text-sm text-green-600">✓ Image uploaded successfully</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="mx-auto size-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose an image to upload (Max 4MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="mr-2 size-4" />
                        Select Image
                      </label>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="style" className="text-sm font-medium">
                  Caption Style
                </Label>
                <Select value={style} onValueChange={(value: typeof style) => setStyle(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="descriptive">Descriptive</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
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
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <Checkbox 
                  id="hashtags" 
                  checked={includeHashtags}
                  onCheckedChange={(checked) => setIncludeHashtags(checked as boolean)}
                />
                <Label htmlFor="hashtags" className="text-sm font-medium">
                  Include Hashtags
                </Label>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-destructive text-sm">
                {error}
              </div>
            )}

            {caption && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Generated Caption:</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 size-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 size-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg border">
                  <p className="whitespace-pre-wrap">{caption}</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerate}
              disabled={loading || !imageUrl}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> 
                  Generating Caption...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 size-4" />
                  Generate Caption
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 