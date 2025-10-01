import LandingPage from "@/components/LandingPage";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await currentUser();

  if (!user) {
    return <LandingPage />;
  }
  redirect("/events");
}
