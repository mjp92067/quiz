import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { type QuizTemplate } from "@db/schema";

interface TemplateSelectProps {
  onSelect: (template: QuizTemplate) => void;
}

export function TemplateSelect({ onSelect }: TemplateSelectProps) {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["quiz-templates"],
    queryFn: async () => {
      const response = await fetch("/api/quiz/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    }
  });

  if (isLoading) {
    return <div className="text-center p-4">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Select a Template</h3>
      <RadioGroup className="grid gap-4">
        {templates?.map((template: QuizTemplate) => (
          <div key={template.id}>
            <RadioGroupItem
              value={template.id.toString()}
              id={`template-${template.id}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`template-${template.id}`}
              className="flex flex-col gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <span className="font-semibold">{template.name}</span>
              <span className="text-sm text-muted-foreground">
                {template.description}
              </span>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{template.type}</span>
                <span>•</span>
                <span>{template.difficulty}</span>
                <span>•</span>
                <span>{template.level}</span>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
      <Button 
        onClick={() => templates?.length && onSelect(templates[0])} 
        className="w-full mt-4"
      >
        Use Selected Template
      </Button>
    </div>
  );
}
