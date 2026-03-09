import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-3 text-muted-foreground">
          By using TutorConnect, you agree to these terms.
        </p>

        <div className="mt-8 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform rules</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Be respectful and follow Nepal’s laws.</p>
              <p>• Do not spam, harass, or share illegal content.</p>
              <p>• Tutors are responsible for the quality of their lessons.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• The platform uses manual verification for one-time connection fees.</p>
              <p>• Payments are handled via eSewa and Khalti as described in the app.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              For support, use the contact details in the footer.
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
