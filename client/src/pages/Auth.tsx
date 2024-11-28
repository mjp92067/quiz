import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@db/schema";

export function Auth() {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: ""
    }
  });

  const handleSubmit = async (data: z.infer<typeof insertUserSchema>) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Account created successfully!"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Sign Up</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Form fields implementation */}
          </form>
        </Form>
        
        <div className="mt-6">
          <Button className="w-full" variant="outline" onClick={() => window.location.href = "/api/auth/google"}>
            Continue with Google
          </Button>
          <Button className="w-full mt-2" variant="outline" onClick={() => window.location.href = "/api/auth/facebook"}>
            Continue with Facebook
          </Button>
        </div>
      </Card>
    </div>
  );
}
