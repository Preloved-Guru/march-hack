import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import NotFound from "./pages/NotFound"; // File exists
import RetailDashboard from "./pages/RetailDashboard";
import NewArrivals from "./pages/NewArrivals";
import ProfilePage from "./pages/ProfilePage";
import ItemDetail from "./pages/ItemDetail";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/shop" element={<NewArrivals />} />
          <Route path="/retail" element={<RetailDashboard />} />
          <Route path="/retail/upload" element={<RetailDashboard />} />
          <Route path="/new" element={<NewArrivals />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/item/:id" element={<ItemDetail />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
