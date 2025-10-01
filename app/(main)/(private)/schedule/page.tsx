import { getSchedule } from "@/app/server/actions/schedule";
import { ScheduleForm } from "@/components/forms/ScheduleForm";
// import { ScheduleForm } from "@/components/forms/ScheduleForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@clerk/nextjs/server";

export default async function SchedulePage() {
  // Check if the user is authenticated (using Clerk authentication)
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn(); // Redirect to sign-in page if user is not authenticated

  // Query the database to fetch the user's schedule based on the authenticated user
  const schedule = await getSchedule(userId);

  return (
    <Card className="max-w-md mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
      <CardHeader>
        <CardTitle>Schedule</CardTitle> {/* Display title for the page */}
      </CardHeader>
      <CardContent>
        <ScheduleForm schedule={schedule} />
        {/* Render the ScheduleForm component with the fetched schedule */}
      </CardContent>
    </Card>
  );
}
