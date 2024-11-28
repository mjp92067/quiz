import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShareQuiz } from "@/components/ShareQuiz";
import { Leaderboard } from "@/components/Leaderboard";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

const quizSchema = z.object({
  contentType: z.enum(["text", "document", "image"]),
  content: z.string().min(1, "Content is required"),
  file: z.instanceof(File).optional()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      'File size should be less than 5MB'
    )
    .refine(
      (file) => {
        if (!file) return true;
        return ACCEPTED_DOCUMENT_TYPES.includes(file.type) || ACCEPTED_IMAGE_TYPES.includes(file.type);
      },
      'Invalid file type'
    ),
  type: z.enum(["multiple-choice", "true-false", "fill-blank"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  level: z.enum(["elementary", "middle", "high", "university"]),
  numQuestions: z.number().min(1).max(50)
});

type QuizFormData = z.infer<typeof quizSchema>;

export function Quiz() {
  const { toast } = useToast();
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("text");

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      contentType: "text",
      content: "",
      type: "multiple-choice",
      difficulty: "medium",
      level: "high",
      numQuestions: 10
    }
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Update form values
      form.setValue("file", file);
      form.setValue("contentType", file.type.startsWith("image/") ? "image" : "document");

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }

      // For text files, read content
      if (file.type === "text/plain") {
        const text = await file.text();
        form.setValue("content", text);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive"
      });
    }
  };

  const generateQuiz = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const formData = new FormData();
      
      // Add all required fields
      formData.append('content', data.content || '');
      formData.append('contentType', data.contentType);
      formData.append('type', data.type);
      formData.append('difficulty', data.difficulty);
      formData.append('level', data.level);
      formData.append('numQuestions', String(data.numQuestions));
      
      // Add file if present
      if (data.file) {
        formData.append('file', data.file);
      }

      // Debug log
      console.log('Submitting form data:', {
        content: data.content,
        contentType: data.contentType,
        type: data.type,
        difficulty: data.difficulty,
        level: data.level,
        numQuestions: data.numQuestions,
        hasFile: !!data.file
      });

      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Failed to generate quiz");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Quiz Generated Successfully",
        description: `Created ${data.questions.length} questions!`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate Quiz",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Generate Quiz</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => generateQuiz.mutate(data))} className="space-y-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text">Text Input</TabsTrigger>
                <TabsTrigger value="document">Document Upload</TabsTrigger>
                <TabsTrigger value="image">Image Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study Material</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter your study material here"
                          className="min-h-[200px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="document" className="mt-4">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload Document</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed rounded-lg p-4 hover:bg-accent cursor-pointer">
                          <Input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                            id="document-upload"
                          />
                          <label htmlFor="document-upload" className="cursor-pointer text-center">
                            <p className="text-sm text-muted-foreground">
                              Drop your document here or click to upload
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Supported formats: PDF, DOCX, TXT (max 5MB)
                            </p>
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="image" className="mt-4">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload Image</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed rounded-lg p-4 hover:bg-accent cursor-pointer">
                          <Input
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={handleFileChange}
                            className="hidden"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload" className="cursor-pointer text-center">
                            {filePreview ? (
                              <img
                                src={filePreview}
                                alt="Preview"
                                className="max-h-[180px] object-contain"
                              />
                            ) : (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  Drop your image here or click to upload
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Supported formats: PNG, JPG, JPEG (max 5MB)
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="true-false">True/False</SelectItem>
                      <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="elementary">Elementary</SelectItem>
                      <SelectItem value="middle">Middle School</SelectItem>
                      <SelectItem value="high">High School</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numQuestions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Questions</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))}
                      min={1}
                      max={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={generateQuiz.isPending}>
              {generateQuiz.isPending ? "Generating..." : "Generate Quiz"}
            </Button>
          </form>
        </Form>
      </Card>

      {/* Display generated quiz questions */}
      {generateQuiz.data && (
        <div className="mt-8 space-y-6">
          <Card className="p-6">
            <h3 className="text-2xl font-bold mb-4">Generated Quiz</h3>
            <div className="space-y-6">
              {generateQuiz.data.questions.map((question: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Question {index + 1}</h4>
                  <p className="mb-4">{question.question}</p>
                  <RadioGroup>
                    <div className="space-y-2">
                      {question.options.map((option: string, optionIndex: number) => (
                        <div key={optionIndex} className="flex items-center">
                          <RadioGroupItem
                            value={option}
                            id={`q${index}-${optionIndex}`}
                            disabled
                          />
                          <Label htmlFor={`q${index}-${optionIndex}`} className="ml-2">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>
          </Card>

          <ShareQuiz
            quizId={generateQuiz.data.id}
            isPublic={generateQuiz.data.isPublic}
            shareCode={generateQuiz.data.shareCode}
            onShare={async () => {
              try {
                const response = await fetch("/api/quiz/share", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ quizId: generateQuiz.data.id })
                });
                
                if (!response.ok) {
                  throw new Error("Failed to share quiz");
                }

                const result = await response.json();
                toast({
                  title: "Quiz Shared Successfully",
                  description: `Share code: ${result.shareCode}`
                });
              } catch (error) {
                toast({
                  title: "Failed to Share Quiz",
                  description: error instanceof Error ? error.message : "Unknown error occurred",
                  variant: "destructive"
                });
              }
            }}
          />
          
          <Leaderboard quizId={generateQuiz.data.id} />
        </div>
      )}
    </div>
  );
}
