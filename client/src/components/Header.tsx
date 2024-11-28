import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Timer className="h-6 w-6" />
            <span className="font-bold text-xl">QuizUp</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/about">About</Link>
            <Link href="/friends">Friends</Link>
            <Button variant="outline" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
