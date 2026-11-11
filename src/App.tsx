// Carelo App
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AboutUs from "./pages/AboutUs";
import PitchDeck from "./pages/PitchDeck";
import Impressum from "./pages/Impressum";
import DemoLogin from "./pages/DemoLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PrototypeBanner = () => (
  <div className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-gray-900/90 px-4 py-2 text-center text-xs text-white shadow-lg sm:text-sm">
    Prototype from 2025. AI backend is currently offline.
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PrototypeBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<DemoLogin />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/pitch" element={<PitchDeck />} />
          <Route path="/impressum" element={<Impressum />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
