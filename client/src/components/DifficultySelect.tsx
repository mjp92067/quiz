import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function DifficultySelect() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-12">Choose Your Difficulty</h2>
        
        <div className="max-w-md mx-auto">
          <RadioGroup defaultValue="medium" className="grid grid-cols-3 gap-4 mb-8">
            <div>
              <RadioGroupItem value="easy" id="easy" className="peer sr-only" />
              <Label
                htmlFor="easy"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Easy
              </Label>
            </div>
            <div>
              <RadioGroupItem value="medium" id="medium" className="peer sr-only" />
              <Label
                htmlFor="medium"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Medium
              </Label>
            </div>
            <div>
              <RadioGroupItem value="hard" id="hard" className="peer sr-only" />
              <Label
                htmlFor="hard"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Hard
              </Label>
            </div>
          </RadioGroup>

          <Button size="lg" className="w-full">
            Create Your Quiz Now
          </Button>
        </div>
      </div>
    </section>
  );
}
