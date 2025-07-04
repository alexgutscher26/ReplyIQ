/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import {
  Brain,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  MoreVertical,
  UserCircle,
  Search,
  XCircle,
  PlusCircle,
  Target,
  BarChart3,
  Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const createBrandVoiceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().optional(),
  industry: z.string().min(1, "Industry is required"),
  toneAttributes: z.array(z.string()).optional(),
});

const addTrainingDataSchema = z.object({
  brandVoiceId: z.string().uuid(),
  contentType: z.string().min(1, "Content type is required"),
  title: z.string().optional(),
  content: z.string().min(10, "Content must be at least 10 characters"),
  platform: z.string().optional(),
});

// Schema for content generation
const generateContentSchema = z.object({
  brandVoiceId: z.string().uuid(),
  prompt: z.string().min(1, "Prompt is required"),
  contentType: z.string().optional(),
  platform: z.string().optional(),
  maxLength: z.number().min(50).max(5000).optional(),
});

type CreateBrandVoiceForm = z.infer<typeof createBrandVoiceSchema>;
type AddTrainingDataForm = z.infer<typeof addTrainingDataSchema>;
type GenerateContentForm = z.infer<typeof generateContentSchema>;

// Use a simpler interface that matches what we actually use
interface BrandVoice {
  id: string;
  name: string;
  description?: string | null;
  industry: string | null;
  industryName: string;
  trainingStatus: string | null;
  trainingProgress?: number | null;
  toneAttributes?: unknown;
  trainingDataCount: number;
  lastTrainingAt?: Date | null;
  isActive?: boolean | null;
}

const TONE_ATTRIBUTES = [
  "Professional",
  "Friendly",
  "Authoritative",
  "Casual",
  "Enthusiastic",
  "Trustworthy",
  "Innovative",
  "Caring",
  "Bold",
  "Sophisticated",
  "Playful",
  "Direct",
  "Warm",
  "Expert",
  "Approachable",
];

/**
 * Main component for managing brand voices, including training, generating content,
 * editing, and viewing analytics for each brand voice.
 *
 * This component manages state for various dialogs (create, train, generate,
 * edit, analytics) and fetches all brand voices from the API. It provides
 * functionality to filter brand voices based on search queries and handles
 * operations like training, generating content, editing, deleting, and viewing
 * analytics for each voice.
 *
 * @returns The JSX representation of the Brand Voice Training page.
 */
export default function BrandVoiceTrainingPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<BrandVoice | null>(null);
  const [search, setSearch] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);

  const {
    data: brandVoices = [],
    isLoading,
    refetch,
  } = api.brandVoice.getAll.useQuery();

  const trainMutation = api.brandVoice.trainBrandVoice.useMutation({
    onSuccess: () => {
      toast.success("Brand voice training started!");
      void refetch();
    },
    onError: (error) => {
      toast.error("Failed to start training", {
        description: error.message,
      });
    },
  });

  const deleteMutation = api.brandVoice.delete.useMutation({
    onSuccess: () => {
      toast.success("Brand voice deleted!");
      void refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete brand voice", {
        description: error.message,
      });
    },
  });

  /**
   * Triggers a train mutation with the given ID.
   */
  const handleTrain = (id: string) => {
    trainMutation.mutate({ brandVoiceId: id });
  };

  /**
   * Sets the selected voice and opens the generate dialog.
   */
  const handleGenerate = (voice: BrandVoice) => {
    setSelectedVoice(voice);
    setGenerateDialogOpen(true);
  };

  /**
   * Handles the edit action by selecting a voice and opening the edit dialog.
   */
  const handleEdit = (voice: BrandVoice) => {
    setSelectedVoice(voice);
    setEditDialogOpen(true);
  };

  /**
   * Confirms deletion of a brand voice and triggers the mutation to delete it.
   */
  const handleDelete = (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this brand voice? This action cannot be undone.",
      )
    ) {
      deleteMutation.mutate({ id });
    }
  };

  /**
   * Handles setting the selected voice and opening the analytics dialog.
   */
  const handleViewAnalytics = (voice: BrandVoice) => {
    setSelectedVoice(voice);
    setAnalyticsDialogOpen(true);
  };

  /**
   * Handles adding training data by setting the selected voice and opening the training dialog.
   */
  const handleAddTrainingData = (voice: BrandVoice) => {
    setSelectedVoice(voice);
    setTrainingDialogOpen(true);
  };

  /**
   * Filters brand voices by search query (name or industry).
   * @param brandVoices - Array of brand voices.
   * @param search - Search string.
   */
  function filterBrandVoices(
    brandVoices: BrandVoice[],
    search: string,
  ): BrandVoice[] {
    return brandVoices.filter((voice) => {
      const q = search.toLowerCase();
      return (
        voice.name.toLowerCase().includes(q) ||
        voice.industryName?.toLowerCase().includes(q)
      );
    });
  }

  const filteredBrandVoices = filterBrandVoices(brandVoices, search);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Brand Voice Training
            </h2>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-muted h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-muted-foreground/10 sticky top-0 z-10 flex flex-col gap-4 border-b py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Brain className="text-primary h-6 w-6" /> Brand Voice Training
          </h2>
          <p className="text-muted-foreground">
            Create and train AI models on your unique brand voice and
            communication style.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 md:flex-row">
          <div className="relative w-64">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              aria-label="Search brand voices"
              placeholder="Search by name or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-8 pl-8"
            />
            {search && (
              <button
                type="button"
                className="text-muted-foreground hover:text-primary absolute top-2.5 right-2"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Brand Voice
          </Button>
        </div>
      </div>

      {brandVoices.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <Image
            src="/mintlify-docs/images/hero-light.png"
            alt="Brand Voice"
            width={128}
            height={128}
            className="mx-auto mb-4"
            priority
          />
          <h3 className="mb-2 text-lg font-semibold">No Brand Voices Yet</h3>
          <p className="text-muted-foreground mb-6">
            {search
              ? "No brand voices match your search."
              : "Create your first brand voice to start training AI on your unique communication style."}
          </p>
          <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Your First Brand Voice
          </Button>
          <p className="text-muted-foreground mt-2 text-xs">
            Tip: You can train multiple voices for different products or
            audiences!
          </p>
        </Card>
      ) : (
        <>
          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Brand Voices
                </CardTitle>
                <Brain className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{brandVoices.length}</div>
                <p className="text-muted-foreground text-xs">
                  {
                    brandVoices.filter((v) => v.trainingStatus === "trained")
                      .length
                  }{" "}
                  trained
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Training Samples
                </CardTitle>
                <FileText className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {brandVoices.reduce(
                    (acc: number, voice) =>
                      acc + (voice.trainingDataCount ?? 0),
                    0,
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Across all brand voices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ready to Use
                </CardTitle>
                <CheckCircle2 className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    brandVoices.filter((v) => v.trainingStatus === "trained")
                      .length
                  }
                </div>
                <p className="text-muted-foreground text-xs">
                  Brand voices ready for content generation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Brand Voices Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBrandVoices.map((voice) => (
              <BrandVoiceCard
                key={voice.id}
                voice={voice}
                onTrain={handleTrain}
                onGenerate={handleGenerate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewAnalytics={handleViewAnalytics}
                onAddTrainingData={handleAddTrainingData}
              />
            ))}
          </div>

          {/* Training Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Training Tips for Better Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <h4 className="font-medium">Quality over Quantity</h4>
                  <p className="text-muted-foreground text-sm">
                    3-5 high-quality, representative samples work better than
                    many poor examples.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Diverse Content Types</h4>
                  <p className="text-muted-foreground text-sm">
                    Include various content types: social posts, emails, blogs,
                    etc.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Consistent Voice</h4>
                  <p className="text-muted-foreground text-sm">
                    Ensure all samples reflect the same brand voice and tone.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Regular Updates</h4>
                  <p className="text-muted-foreground text-sm">
                    Retrain with new content to keep your brand voice current.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialogs */}
      <CreateBrandVoiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => void refetch()}
      />

      {selectedVoice && (
        <TrainingDataDialog
          voice={selectedVoice}
          open={trainingDialogOpen}
          onOpenChange={setTrainingDialogOpen}
          onSuccess={() => {
            void refetch();
            setTrainingDialogOpen(false);
          }}
        />
      )}

      {selectedVoice && (
        <GenerateContentDialog
          voice={selectedVoice}
          open={generateDialogOpen}
          onOpenChange={setGenerateDialogOpen}
        />
      )}

      {/* Edit Brand Voice Dialog */}
      {selectedVoice && (
        <EditBrandVoiceDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          voice={selectedVoice}
          onSuccess={() => {
            void refetch();
            setEditDialogOpen(false);
          }}
        />
      )}

      {/* Analytics Dialog Placeholder */}
      {selectedVoice && (
        <AnalyticsDialog
          open={analyticsDialogOpen}
          onOpenChange={setAnalyticsDialogOpen}
          voice={selectedVoice}
        />
      )}
    </div>
  );
}

/**
 * Renders a card representing a brand voice with various interactive options.
 *
 * This component displays details about a brand voice, including its status,
 * training progress, tone attributes, and actions such as editing, deleting,
 * or generating content based on the voice's state.
 *
 * @param {Object} props - The properties for the BrandVoiceCard component.
 * @param {BrandVoice} props.voice - The brand voice data to display.
 * @param {Function} props.onTrain - Callback function when training a voice.
 * @param {Function} props.onGenerate - Callback function when generating content with the voice.
 * @param {Function} props.onEdit - Callback function when editing the voice.
 * @param {Function} props.onDelete - Callback function when deleting the voice.
 * @param {Function} props.onViewAnalytics - Callback function to view analytics for the voice.
 * @param {Function} props.onAddTrainingData - Callback function to add training data to the voice.
 */
function BrandVoiceCard({
  voice,
  onTrain,
  onGenerate,
  onEdit,
  onDelete,
  onViewAnalytics,
  onAddTrainingData,
}: {
  voice: BrandVoice;
  onTrain: (id: string) => void;
  onGenerate: (voice: BrandVoice) => void;
  onEdit: (voice: BrandVoice) => void;
  onDelete: (id: string) => void;
  onViewAnalytics: (voice: BrandVoice) => void;
  onAddTrainingData: (voice: BrandVoice) => void;
}) {
  // Status dot color
  /**
   * Determines and returns a status dot component based on the given status.
   *
   * This function assigns a background color to an inline-block span element
   * representing a status dot, using conditional logic to match the input status
   * with predefined color codes. The span also includes a title attribute that
   * defaults to "draft" if no status is provided.
   *
   * @param {string | null} status - The current status for which the dot is rendered.
   */
  const statusDot = (status: string | null) => {
    let color = "bg-gray-400";
    if (status === "trained") color = "bg-green-500";
    else if (status === "analyzing") color = "bg-blue-500";
    else if (status === "error") color = "bg-red-500";
    return (
      <span
        className={`inline-block h-2 w-2 rounded-full ${color} mr-1`}
        title={status ?? "draft"}
      />
    );
  };

  // Avatar (initials)
  const initials = voice.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="border-muted-foreground/10 rounded-xl border transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
          <span className="text-primary text-lg font-bold">
            {initials || (
              <UserCircle className="text-muted-foreground h-8 w-8" />
            )}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="truncate text-lg">{voice.name}</CardTitle>
            <Badge variant="outline" className="max-w-[80px] truncate text-xs">
              {voice.industryName}
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs"
              aria-label="Training samples"
            >
              {voice.trainingDataCount ?? 0} samples
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-2">
            {statusDot(voice.trainingStatus)}
            <span className="text-muted-foreground text-xs capitalize">
              {voice.trainingStatus ?? "draft"}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="ml-auto">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(voice)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewAnalytics(voice)}>
              Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddTrainingData(voice)}>
              Add Training Data
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(voice.id)}
              className="text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Training Progress */}
        {voice.trainingStatus === "analyzing" && (
          <div className="flex items-center gap-2">
            <Progress
              value={voice.trainingProgress ?? 0}
              className="h-2 flex-1"
            />
            <span className="text-muted-foreground text-xs">
              {voice.trainingProgress ?? 0}%
            </span>
          </div>
        )}
        {/* Tone Attributes */}
        {Array.isArray(voice.toneAttributes) &&
          voice.toneAttributes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(voice.toneAttributes as string[])
                .slice(0, 3)
                .map((tone: string) => (
                  <Badge key={tone} variant="outline" className="text-xs">
                    {tone}
                  </Badge>
                ))}
              {voice.toneAttributes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{voice.toneAttributes.length - 3} more
                </Badge>
              )}
            </div>
          )}
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground h-4 w-4" />
            <span>{voice.trainingDataCount ?? 0} samples</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-muted-foreground h-4 w-4" />
            <span>{voice.lastTrainingAt ? "Trained" : "Not trained"}</span>
          </div>
        </div>
        <Separator />
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {(voice.trainingStatus === "draft" || !voice.trainingStatus) && (
            <Button
              size="sm"
              onClick={() => onTrain(voice.id)}
              disabled={(voice.trainingDataCount ?? 0) < 3}
              className="flex-1"
            >
              <Brain className="mr-1 h-4 w-4" />
              Train Voice
            </Button>
          )}
          {voice.trainingStatus === "trained" && (
            <Button
              size="sm"
              onClick={() => onGenerate(voice)}
              className="flex-1"
            >
              <Sparkles className="mr-1 h-4 w-4" />
              Generate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateBrandVoiceDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [selectedTones, setSelectedTones] = useState<string[]>([]);

  const form = useForm<CreateBrandVoiceForm>({
    resolver: zodResolver(createBrandVoiceSchema),
    defaultValues: {
      name: "",
      description: "",
      industry: "",
      toneAttributes: [],
    },
  });

  const { data: options } = api.brandVoice.getOptions.useQuery();
  const createMutation = api.brandVoice.create.useMutation({
    onSuccess: () => {
      toast.success("Brand voice created successfully!");
      form.reset();
      setSelectedTones([]);
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error("Failed to create brand voice", {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: CreateBrandVoiceForm) => {
    createMutation.mutate({
      ...data,
      toneAttributes: selectedTones,
    });
  };

  const toggleTone = (tone: string) => {
    setSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Brand Voice</DialogTitle>
          <DialogDescription>
            Create a new brand voice profile to train your AI on your unique
            communication style.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Voice Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Professional Tech Blog"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this brand voice profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the context and purpose of this brand voice..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options &&
                        Object.entries(options.industries).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium">Tone Attributes</label>
              <p className="text-muted-foreground mb-3 text-sm">
                Select tone attributes that describe your brand&apos;s
                communication style.
              </p>
              <div className="flex flex-wrap gap-2">
                {TONE_ATTRIBUTES.map((tone) => (
                  <Button
                    key={tone}
                    type="button"
                    variant={
                      selectedTones.includes(tone) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleTone(tone)}
                  >
                    {tone}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Brand Voice
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Displays a dialog for adding training data related to a brand voice.
 *
 * The component uses React Hook Form for form handling and manages state using Zustand.
 * It fetches content type options from the API and allows users to submit training data.
 * Upon successful submission, it displays a success toast and resets the form.
 */
function TrainingDataDialog({
  voice,
  open,
  onOpenChange,
  onSuccess,
}: {
  voice: BrandVoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const form = useForm<AddTrainingDataForm>({
    resolver: zodResolver(addTrainingDataSchema),
    defaultValues: {
      brandVoiceId: voice?.id ?? "",
      contentType: "",
      title: "",
      content: "",
      platform: "",
    },
  });

  const { data: options } = api.brandVoice.getOptions.useQuery();
  const addDataMutation = api.brandVoice.addTrainingData.useMutation({
    onSuccess: () => {
      toast.success("Training data added successfully!");
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Failed to add training data", {
        description: error.message,
      });
    },
  });

  /**
   * Submits form data with additional branding information.
   */
  const onSubmit = (data: AddTrainingDataForm) => {
    addDataMutation.mutate({
      ...data,
      brandVoiceId: voice.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Training Data</DialogTitle>
          <DialogDescription>
            Add content samples to train the &quot;{voice?.name}&quot; brand
            voice. More samples improve accuracy.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options &&
                        Object.entries(options.contentTypes).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Content title or description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste your brand content here..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add authentic content that represents your brand voice. The
                    more diverse samples you provide, the better the AI will
                    understand your style.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Twitter, LinkedIn, Blog"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addDataMutation.isPending}>
                {addDataMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Training Data
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Generates a content dialog component for creating content using a specified brand voice.
 *
 * This function handles form submission, validation, and communication with API endpoints to generate content.
 * It includes type guards for handling different response formats from the server and provides functionality
 * to copy generated content. The component also manages UI states such as open/close status, error messages,
 * and result display.
 *
 * @param voice - An object containing details about the brand voice.
 * @param open - A boolean indicating whether the dialog is currently open.
 * @param onOpenChange - A function to handle changes in the dialog's open state.
 * @returns The React component rendering the content generation dialog.
 */
function GenerateContentDialog({
  voice,
  open,
  onOpenChange,
}: {
  voice: BrandVoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<GenerateContentForm>({
    resolver: zodResolver(generateContentSchema),
    defaultValues: {
      brandVoiceId: voice?.id ?? "",
      prompt: "",
      contentType: undefined,
      platform: undefined,
      maxLength: 300,
    },
  });
  const { data: options } = api.brandVoice.getOptions.useQuery();
  const generateMutation = api.brandVoice.generateContent.useMutation();
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  /**
   * Handles form submission for generating content.
   *
   * This function processes the form data, initiates a mutation to generate content,
   * and handles the response by determining the correct property containing the generated content.
   * It sets the result or error state accordingly and scrolls to the result section smoothly.
   * Additionally, it cleans up any ongoing animations on component unmount.
   *
   * @param data - The form data used for generating content.
   */
  const onSubmit = async (data: GenerateContentForm) => {
    setResult("");
    setError(null);
    setCopied(false);

    try {
      const res = await generateMutation.mutateAsync(data);

      // Type guard functions with proper type narrowing
      /**
       * Checks if the given object has a 'content' property that is a string.
       *
       * This function verifies if the provided object is defined, an instance of Object,
       * not null, and contains a 'content' property whose value is a string.
       *
       * @param obj - The unknown object to be checked for content property.
       */
      const hasContent = (obj: unknown): obj is { content: string } => {
        return Boolean(
          obj &&
            typeof obj === "object" &&
            obj !== null &&
            "content" in obj &&
            typeof (obj as { content: unknown }).content === "string",
        );
      };

      /**
       * Checks if the provided object has a 'text' property that is a string.
       *
       * This function first verifies if the input is an object and not null.
       * It then checks if the object contains a 'text' property and ensures that
       * this property is of type string. The function returns true if all these
       * conditions are met, otherwise false.
       *
       * @param obj - The unknown object to be checked for the presence of a string 'text' property.
       */
      const hasText = (obj: unknown): obj is { text: string } => {
        return Boolean(
          obj &&
            typeof obj === "object" &&
            obj !== null &&
            "text" in obj &&
            typeof (obj as { text: unknown }).text === "string",
        );
      };

      /**
       * Checks if an object has a 'generatedContent' property that is a string.
       *
       * This function verifies if the provided object is not null, is of type 'object',
       * and contains a 'generatedContent' property which is specifically a string.
       * It uses TypeScript's type guard syntax to assert the type if the conditions are met.
       */
      const hasGeneratedContent = (
        obj: unknown,
      ): obj is { generatedContent: string } => {
        return Boolean(
          obj &&
            typeof obj === "object" &&
            obj !== null &&
            "generatedContent" in obj &&
            typeof (obj as { generatedContent: unknown }).generatedContent ===
              "string",
        );
      };

      let content = "";
      if (hasContent(res)) {
        content = res.content;
      } else if (hasText(res)) {
        content = res.text;
      } else if (hasGeneratedContent(res)) {
        content = res.generatedContent;
      } else {
        throw new Error("Unexpected response format from the server");
      }

      setResult(content);

      // Use requestAnimationFrame for smoother scrolling
      /**
       * Scrolls to the element referenced by `resultRef` smoothly if it exists.
       */
      const scrollToResult = () => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: "smooth" });
        }
      };

      // Use requestAnimationFrame for better performance
      const frameId = window.requestAnimationFrame(() => {
        scrollToResult();
      });

      // Cleanup function
      return () => {
        window.cancelAnimationFrame(frameId);
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Failed to generate content";

      setError(errorMessage);
      console.error("Content generation error:", errorMessage);
    }
  };

  /**
   * Copies text to clipboard and toggles copied state.
   */
  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Content</DialogTitle>
          <DialogDescription>
            Use the trained "{voice?.name}" brand voice to generate new content.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What do you want to write?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {options &&
                          Object.entries(options.contentTypes).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Twitter, Blog" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Length</FormLabel>
                    <FormControl>
                      <Input type="number" min={50} max={5000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={generateMutation.isPending}>
                {generateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate
              </Button>
            </div>
          </form>
        </Form>
        {error && <div className="text-destructive mt-4 text-sm">{error}</div>}
        {result && (
          <div ref={resultRef} className="bg-muted mt-6 rounded border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">Generated Content</span>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}{" "}
                Copy
              </Button>
            </div>
            <div className="text-sm whitespace-pre-line">{result}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditBrandVoiceDialog({
  open,
  onOpenChange,
  voice,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voice: BrandVoice;
  onSuccess: () => void;
}) {
  const [selectedTones, setSelectedTones] = useState<string[]>(
    (voice.toneAttributes as string[]) ?? [],
  );
  const form = useForm<CreateBrandVoiceForm>({
    resolver: zodResolver(createBrandVoiceSchema),
    defaultValues: {
      name: voice.name,
      description: voice.description ?? "",
      industry: voice.industry ?? "",
      toneAttributes: (voice.toneAttributes as string[]) ?? [],
    },
  });
  const { data: options } = api.brandVoice.getOptions.useQuery();
  const updateMutation = api.brandVoice.update.useMutation({
    onSuccess: () => {
      toast.success("Brand voice updated successfully!");
      form.reset();
      setSelectedTones([]);
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error("Failed to update brand voice", {
        description: error.message,
      });
    },
  });
  const onSubmit = (data: CreateBrandVoiceForm) => {
    updateMutation.mutate({
      ...data,
      id: voice.id,
      toneAttributes: selectedTones,
    });
  };
  const toggleTone = (tone: string) => {
    setSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone],
    );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="text-primary h-5 w-5" /> Edit Brand Voice
          </DialogTitle>
          <DialogDescription>
            Update your brand voice profile.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Voice Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Professional Tech Blog"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this brand voice profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the context and purpose of this brand voice..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options &&
                        Object.entries(options.industries).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <label className="text-sm font-medium">Tone Attributes</label>
              <p className="text-muted-foreground mb-3 text-sm">
                Select tone attributes that describe your brand&apos;s
                communication style.
              </p>
              <div className="flex flex-wrap gap-2">
                {TONE_ATTRIBUTES.map((tone) => (
                  <Button
                    key={tone}
                    type="button"
                    variant={
                      selectedTones.includes(tone) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleTone(tone)}
                  >
                    {tone}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AnalyticsDialog({
  open,
  onOpenChange,
  voice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voice: BrandVoice;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="text-primary h-5 w-5" /> Analytics for{" "}
            {voice.name}
          </DialogTitle>
          <DialogDescription>
            Analytics and usage data will be available here soon.
          </DialogDescription>
        </DialogHeader>
        <div className="text-muted-foreground py-8 text-center">
          <BarChart3 className="mx-auto mb-2 h-8 w-8" />
          <p>Coming soon: Detailed analytics for your brand voice.</p>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
