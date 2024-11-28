import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Share2, Copy, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ShareQuizProps {
  quizId: number;
  isPublic?: boolean;
  shareCode?: string;
}

export function ShareQuiz({ quizId, isPublic, shareCode }: ShareQuizProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareQuiz = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/quiz/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId })
      });
      if (!response.ok) throw new Error("Failed to share quiz");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quiz shared successfully!"
      });
    }
  });

  const copyToClipboard = async () => {
    if (shareCode) {
      await navigator.clipboard.writeText(
        `${window.location.origin}/quiz/shared/${shareCode}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isPublic || !shareCode) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            <span>Share Quiz</span>
          </div>
          <Button 
            onClick={() => shareQuiz.mutate()}
            disabled={shareQuiz.isPending}
          >
            {shareQuiz.isPending ? "Sharing..." : "Share"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          <span>Share Code: {shareCode}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
}
