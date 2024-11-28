import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { HowItWorks } from "../components/HowItWorks";
import { DifficultySelect } from "../components/DifficultySelect";

export function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-6xl font-bold mb-6">
            Learn Anything with AI-Powered Quizzes
          </h1>
          <p className="text-xl mb-8 text-gray-600">
            Upload documents, paste text, or use images. Quizzer generates
            personalized quizzes to boost your knowledge.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/quiz">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </section>

        {/* How It Works Section */}
        <HowItWorks />

        {/* Difficulty Selection */}
        <DifficultySelect />
      </main>

      <Footer />
    </div>
  );
}
