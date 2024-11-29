import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface DifficultyDistribution {
  name: string;
  value: number;
}

interface CompletionRate {
  date: string;
  completed: number;
  attempted: number;
}

interface UserEngagement {
  date: string;
  activeUsers: number;
  newQuizzes: number;
}

interface PerformanceTrend {
  week: string;
  avgScore: number;
  avgTime: number;
}

interface QuizStats {
  completionRate: CompletionRate[];
  difficultyDistribution: DifficultyDistribution[];
}

interface UserEngagementData {
  daily: UserEngagement[];
}

interface PerformanceTrendsData {
  weekly: PerformanceTrend[];
}

export function Analytics() {
  const { data: quizStats, isLoading: loadingQuizStats } = useQuery<QuizStats>({
    queryKey: ["quiz-stats"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/quiz-stats");
      if (!response.ok) throw new Error("Failed to fetch quiz statistics");
      return response.json();
    }
  });

  const { data: userEngagement, isLoading: loadingEngagement } = useQuery<UserEngagementData>({
    queryKey: ["user-engagement"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/user-engagement");
      if (!response.ok) throw new Error("Failed to fetch user engagement");
      return response.json();
    }
  });

  const { data: performanceTrends, isLoading: loadingTrends } = useQuery<PerformanceTrendsData>({
    queryKey: ["performance-trends"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/performance-trends");
      if (!response.ok) throw new Error("Failed to fetch performance trends");
      return response.json();
    }
  });

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quiz Completion Stats */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quiz Completion Rate</h2>
            <ChartContainer className="h-[300px]" config={{}}>
              <BarChart data={quizStats?.completionRate || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="completed" fill="#0088FE" name="Completed" />
                <Bar dataKey="attempted" fill="#00C49F" name="Attempted" />
              </BarChart>
            </ChartContainer>
          </Card>

          {/* Difficulty Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quiz Difficulty Distribution</h2>
            <ChartContainer className="h-[300px]" config={{}}>
              <PieChart>
                <Pie
                  data={quizStats?.difficultyDistribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {quizStats?.difficultyDistribution?.map((item: DifficultyDistribution, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </Card>

          {/* User Engagement */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">User Engagement</h2>
            <ChartContainer className="h-[300px]" config={{}}>
              <LineChart data={userEngagement?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="activeUsers" stroke="#0088FE" name="Active Users" />
                <Line type="monotone" dataKey="newQuizzes" stroke="#00C49F" name="New Quizzes" />
              </LineChart>
            </ChartContainer>
          </Card>

          {/* Performance Trends */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Trends</h2>
            <ChartContainer className="h-[300px]" config={{}}>
              <LineChart data={performanceTrends?.weekly || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="avgScore" stroke="#0088FE" name="Average Score" />
                <Line type="monotone" dataKey="avgTime" stroke="#00C49F" name="Average Time (s)" />
              </LineChart>
            </ChartContainer>
          </Card>
        </div>
      </div>
    </>
  );
}
