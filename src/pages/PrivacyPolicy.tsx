import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-3 text-muted-foreground">
          TutorConnect respects your privacy. This page explains what we collect and how we use it.
        </p>

        <div className="mt-8 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What we collect</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Account info (email) so you can log in securely.</p>
              <p>• Profile info you provide (name, city, subjects) to match students and tutors.</p>
              <p>• Messages and booking details to run the service.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How we use data</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• To provide tutoring discovery, messaging, and booking features.</p>
              <p>• To prevent abuse and keep the platform safe.</p>
              <p>• To support you when you contact us.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              If you have privacy questions, contact support using the details in the footer.
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
