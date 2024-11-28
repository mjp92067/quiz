import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Leaderboard } from "@/components/Leaderboard";

export function SharedQuiz() {
  const { shareCode } = useParams();
  const { toast } = useToast();
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [completed, setCompleted] = useState(false);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["shared-quiz", shareCode],
    queryFn: async () => {
      const response = await fetch(`/api/quiz/shared/${shareCode}`);
      if (!response.ok) throw new Error("Failed to fetch quiz");
      return response.json();
    }
  });

  const submitScore = useMutation({
    mutationFn: async () => {
      if (!startTime || !quiz) return;
      const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      
      const response = await fetch(`/api/quiz/${quiz.id}/leaderboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, timeTaken })
      });
      
      if (!response.ok) throw new Error("Failed to submit score");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Score submitted successfully!"
      });
      setCompleted(true);
    }
  });

  const startQuiz = () => {
    setStartTime(new Date());
    // Additional quiz start logic here
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-center">Loading quiz...</p>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-center">Quiz not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">{quiz.title}</h2>
        {!startTime && !completed && (
          <Button onClick={startQuiz}>Start Quiz</Button>
        )}
        {startTime && !completed && (
          <div className="space-y-4">
            {/* Quiz questions would be rendered here */}
            <Button 
              onClick={() => submitScore.mutate()}
              disabled={submitScore.isPending}
            >
              {submitScore.isPending ? "Submitting..." : "Submit Score"}
            </Button>
          </div>
        )}
        {completed && (
          <div className="text-center">
            <p className="text-xl mb-4">Quiz completed!</p>
            <p>Your score: {score}</p>
          </div>
        )}
      </Card>
      
      <Leaderboard quizId={quiz.id} />
    </div>
  );
}
