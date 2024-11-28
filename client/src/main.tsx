import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import { Home } from "./pages/Home";
import { Quiz } from "./pages/Quiz";
import { Auth } from "./pages/Auth";
import { SharedQuiz } from "./pages/SharedQuiz";
import { Friends } from "./pages/Friends";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/quiz/shared/:shareCode" component={SharedQuiz} />
      <Route path="/auth" component={Auth} />
      <Route path="/friends" component={Friends} />
      <Route>404 Page Not Found</Route>
    </Switch>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
