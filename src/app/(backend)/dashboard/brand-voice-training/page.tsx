"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { 
  Plus,
  Brain,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Sparkles,
  Target,
  BarChart3,
  Edit
} from "lucide-react";

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

// Schema for future use in content generation
// const generateContentSchema = z.object({
//   brandVoiceId: z.string().uuid(),
//   prompt: z.string().min(1, "Prompt is required"),
//   contentType: z.string().optional(),
//   platform: z.string().optional(),
//   maxLength: z.number().min(50).max(5000).optional(),
// });

type CreateBrandVoiceForm = z.infer<typeof createBrandVoiceSchema>;
type AddTrainingDataForm = z.infer<typeof addTrainingDataSchema>;

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
  'Professional', 'Friendly', 'Authoritative', 'Casual', 'Enthusiastic',
  'Trustworthy', 'Innovative', 'Caring', 'Bold', 'Sophisticated',
  'Playful', 'Direct', 'Warm', 'Expert', 'Approachable'
];

function BrandVoiceCard({ voice, onTrain, onGenerate, onEdit, onDelete, onViewAnalytics }: {
  voice: BrandVoice;
  onTrain: (id: string) => void;
  onGenerate: (voice: BrandVoice) => void;
  onEdit: (voice: BrandVoice) => void;
  onDelete: (id: string) => void;
  onViewAnalytics: (voice: BrandVoice) => void;
}) {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'trained': return 'bg-green-500';
      case 'analyzing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'trained': return <CheckCircle2 className="h-4 w-4" />;
      case 'analyzing': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{voice.name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {voice.industryName}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className={`${getStatusColor(voice.trainingStatus)} text-white`}>
              {getStatusIcon(voice.trainingStatus)}
              <span className="ml-1 capitalize">{voice.trainingStatus ?? 'draft'}</span>
            </Badge>
          </div>
        </div>
        {voice.description && (
          <CardDescription>{voice.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Training Progress */}
        {voice.trainingStatus === 'analyzing' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Training Progress</span>
              <span>{voice.trainingProgress ?? 0}%</span>
            </div>
            <Progress value={voice.trainingProgress ?? 0} className="h-2" />
          </div>
        )}

        {/* Tone Attributes */}
        {Array.isArray(voice.toneAttributes) && voice.toneAttributes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(voice.toneAttributes as string[]).slice(0, 3).map((tone: string) => (
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
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{voice.trainingDataCount ?? 0} samples</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{voice.lastTrainingAt ? 'Trained' : 'Not trained'}</span>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {(voice.trainingStatus === 'draft' || !voice.trainingStatus) && (
            <Button
              size="sm"
              onClick={() => onTrain(voice.id)}
              disabled={(voice.trainingDataCount ?? 0) < 3}
              className="flex-1"
            >
              <Brain className="h-4 w-4 mr-1" />
              Train Voice
            </Button>
          )}
          
          {voice.trainingStatus === 'trained' && (
            <Button
              size="sm"
              onClick={() => onGenerate(voice)}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Generate
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(voice)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          {voice.trainingStatus === 'trained' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewAnalytics(voice)}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(voice.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateBrandVoiceDialog({ open, onOpenChange, onSuccess }: {
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
    setSelectedTones(prev => 
      prev.includes(tone) 
        ? prev.filter(t => t !== tone)
        : [...prev, tone]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Brand Voice</DialogTitle>
          <DialogDescription>
            Create a new brand voice profile to train your AI on your unique communication style.
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
                    <Input placeholder="e.g., Professional Tech Blog" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options && Object.entries(options.industries).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium">Tone Attributes</label>
              <p className="text-sm text-muted-foreground mb-3">
                Select tone attributes that describe your brand&apos;s communication style.
              </p>
              <div className="flex flex-wrap gap-2">
                {TONE_ATTRIBUTES.map((tone) => (
                  <Button
                    key={tone}
                    type="button"
                    variant={selectedTones.includes(tone) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTone(tone)}
                  >
                    {tone}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Brand Voice
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TrainingDataDialog({ voice, open, onOpenChange, onSuccess }: {
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

  const onSubmit = (data: AddTrainingDataForm) => {
    addDataMutation.mutate({
      ...data,
      brandVoiceId: voice.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Training Data</DialogTitle>
          <DialogDescription>
            Add content samples to train the &quot;{voice?.name}&quot; brand voice. More samples improve accuracy.
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options && Object.entries(options.contentTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Content title or description" {...field} />
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
                    Add authentic content that represents your brand voice. The more diverse samples you provide, the better the AI will understand your style.
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
                    <Input placeholder="e.g., Twitter, LinkedIn, Blog" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addDataMutation.isPending}>
                {addDataMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Training Data
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function BrandVoiceTrainingPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<BrandVoice | null>(null);

  const { 
    data: brandVoices = [], 
    isLoading, 
    refetch 
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

  const handleTrain = (id: string) => {
    trainMutation.mutate({ brandVoiceId: id });
  };

  const handleGenerate = (voice: BrandVoice) => {
    // Navigate to generation interface or open dialog
    setSelectedVoice(voice);
    // Implementation for content generation would go here
  };

  const handleEdit = (voice: BrandVoice) => {
    setSelectedVoice(voice);
    // Implementation for editing would go here
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this brand voice? This action cannot be undone.")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleViewAnalytics = (voice: BrandVoice) => {
    setSelectedVoice(voice);
    // Implementation for analytics view would go here
  };

  // Removed unused function - can be re-added if training dialog needs direct access
  // const openTrainingDialog = (voice: BrandVoice) => {
  //   setSelectedVoice(voice);
  //   setTrainingDialogOpen(true);
  // };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Brand Voice Training</h2>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Brand Voice Training</h2>
          <p className="text-muted-foreground">
            Create and train AI models on your unique brand voice and communication style.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Brand Voice
        </Button>
      </div>

      {brandVoices.length === 0 ? (
        <Card className="p-12 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Brand Voices Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first brand voice to start training AI on your unique communication style.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Brand Voice
          </Button>
        </Card>
      ) : (
        <>
          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Brand Voices</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{brandVoices.length}</div>
                <p className="text-xs text-muted-foreground">
                  {brandVoices.filter(v => v.trainingStatus === 'trained').length} trained
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Training Samples</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {brandVoices.reduce((acc: number, voice) => acc + (voice.trainingDataCount ?? 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all brand voices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready to Use</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {brandVoices.filter(v => v.trainingStatus === 'trained').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Brand voices ready for content generation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Brand Voices Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {brandVoices.map((voice) => (
              <BrandVoiceCard
                key={voice.id}
                voice={voice}
                onTrain={handleTrain}
                onGenerate={handleGenerate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewAnalytics={handleViewAnalytics}
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
                  <p className="text-sm text-muted-foreground">
                    3-5 high-quality, representative samples work better than many poor examples.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Diverse Content Types</h4>
                  <p className="text-sm text-muted-foreground">
                    Include various content types: social posts, emails, blogs, etc.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Consistent Voice</h4>
                  <p className="text-sm text-muted-foreground">
                    Ensure all samples reflect the same brand voice and tone.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Regular Updates</h4>
                  <p className="text-sm text-muted-foreground">
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
    </div>
  );
} 