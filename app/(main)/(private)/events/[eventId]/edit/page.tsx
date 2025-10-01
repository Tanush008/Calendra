import { getEvent } from "@/app/server/actions/events";
import EventForm from "@/components/forms/EventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@clerk/nextjs/server";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn(); // If no userId, redirect to sign-in

  const { eventId } = await params;
  const event = await getEvent(userId, eventId);
  if (!event) return <h1>Event not found</h1>;

  // Render the page with a card layout, displaying the "Edit Event" form
  return (
    <Card className="max-w-md mx-auto border-4 border-blue-100 shadow-2xl shadow-accent-foreground">
      <CardHeader>
        <CardTitle>Edit Event</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Render the EventForm with the event details, passing the event data as props */}
        <EventForm
          event={{ ...event, description: event.description || undefined }} // If description is null, pass undefined
        />
      </CardContent>
    </Card>
  );
}
