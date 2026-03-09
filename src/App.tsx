import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToHash from "@/components/ScrollToHash";
import RequireRole from "@/components/auth/RequireRole";
import RequireAdmin from "@/components/auth/RequireAdmin";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import StudentOnboarding from "./pages/onboarding/StudentOnboarding";
import TutorOnboarding from "./pages/onboarding/TutorOnboarding";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import TutorDashboard from "./pages/dashboards/TutorDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import AdminPanel from "./pages/AdminPanel";
import TutorDiscovery from "./pages/TutorDiscovery";
import TutorProfile from "./pages/TutorProfile";
import BookingFlow from "./pages/BookingFlow";
import Messages from "./pages/Messages";
import ConnectionAgreement from "./pages/ConnectionAgreement";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToHash />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding/student" element={<StudentOnboarding />} />
            <Route path="/onboarding/tutor" element={<TutorOnboarding />} />

            <Route
              path="/student/dashboard"
              element={
                <RequireRole role="student">
                  <StudentDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/tutor/dashboard"
              element={
                <RequireRole role="tutor">
                  <TutorDashboard />
                </RequireRole>
              }
            />

            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminPanel />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
              }
            />

            <Route path="/tutors" element={<TutorDiscovery />} />
            <Route path="/tutors/:id" element={<TutorProfile />} />
            <Route path="/book/:tutorId" element={<BookingFlow />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/connect/:conversationId" element={<ConnectionAgreement />} />

            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
