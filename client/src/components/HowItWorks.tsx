import { FileText, MonitorDot, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function HowItWorks() {
  const features = [
    {
      icon: FileText,
      title: "Upload Documents",
      description: "Import your study materials in various formats."
    },
    {
      icon: MonitorDot,
      title: "Paste Text",
      description: "Copy and paste content directly into Quizzer."
    },
    {
      icon: Image,
      title: "Upload Images",
      description: "Upload an image of any document to generate a quiz."
    }
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center p-6">
              <CardContent>
                <feature.icon className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
