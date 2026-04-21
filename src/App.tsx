import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import AdminLayout from "@/components/AdminLayout";
import Index from "./pages/Index.tsx";
import Checkout from "./pages/Checkout.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import Products from "./pages/admin/Products.tsx";
import Orders from "./pages/admin/Orders.tsx";
import Reviews from "./pages/admin/Reviews.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
          <Route path="/admin/products" element={<AdminLayout><Products /></AdminLayout>} />
          <Route path="/admin/orders" element={<AdminLayout><Orders /></AdminLayout>} />
          <Route path="/admin/reviews" element={<AdminLayout><Reviews /></AdminLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
