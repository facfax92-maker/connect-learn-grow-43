import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

const TutorSettings = () => {
  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-display text-xl font-bold text-foreground">Settings</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Account settings coming soon.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Notification preferences, password change, and account management will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorSettings;
