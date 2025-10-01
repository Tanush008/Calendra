import EventForm from "@/components/forms/EventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewEventPage() {
  return (
    // Container Card component centered on the page with a max width
    <Card className="max-w-md mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
      {/* Header section of the card displaying the title */}
      <CardHeader>
        <CardTitle>New Event</CardTitle>
      </CardHeader>
      
      {/* Content section of the card containing the event form */}
      <CardContent>
        <EventForm />
      </CardContent>
    </Card>
  );
}
