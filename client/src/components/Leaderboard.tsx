import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface LeaderboardProps {
  quizId: number;
}

export function Leaderboard({ quizId }: LeaderboardProps) {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["leaderboard", quizId],
    queryFn: async () => {
      const response = await fetch(`/api/quiz/${quizId}/leaderboard`);
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <p className="text-center">Loading leaderboard...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Leaderboard</h3>
      </div>
      
      <div className="space-y-2">
        {entries?.map((entry: any, index: number) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-2 rounded bg-accent/50"
          >
            <div className="flex items-center gap-3">
              <span className="font-bold">{index + 1}.</span>
              <span>{entry.user.firstName} {entry.user.lastName}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">Score: {entry.score}</span>
              <span className="text-sm text-muted-foreground">
                Time: {Math.floor(entry.timeTaken / 60)}m {entry.timeTaken % 60}s
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
