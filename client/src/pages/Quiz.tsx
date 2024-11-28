import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";

const quizSchema = z.object({
  content: z.string().min(1),
  type: z.enum(["multiple-choice", "true-false", "fill-blank"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  level: z.enum(["elementary", "middle", "high", "university"]),
  numQuestions: z.number().min(1).max(50)
});

export function Quiz() {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      content: "",
      type: "multiple-choice",
      difficulty: "medium",
      level: "high",
      numQuestions: 10
    }
  });

  const generateQuiz = useMutation({
    mutationFn: async (data: z.infer<typeof quizSchema>) => {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz Generated",
        description: "Your quiz is ready to take!"
      });
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => generateQuiz.mutate(data))}>
            {/* Form implementation */}
          </form>
        </Form>
      </Card>
    </div>
  );
}
