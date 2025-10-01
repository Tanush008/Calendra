"use client";

import { useState } from "react";
import { Button, buttonVariants } from "./ui/button";
import { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CopyIcon } from "lucide-react";

type CopyState = "idle" | "copied" | "error";

interface CopyEventButtonProps
  extends Omit<React.ComponentProps<"button">, "children" | "onClick">,
    VariantProps<typeof buttonVariants> {
  eventId: string;
  clerkUserId: string;
}

function getCopyLabel(state: CopyState) {
  switch (state) {
    case "copied":
      return "Copied!";
    case "error":
      return "Error";
    case "idle":
    default:
      return "Copy Link";
  }
}

export function CopyEventButton({
  eventId,
  clerkUserId,
  className,
  variant,
  size,
  ...props
}: CopyEventButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const handleCopy = () => {
    const url = `${location.origin}/book/${clerkUserId}/${eventId}`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopyState("copied");
        // toast()
        setTimeout(() => setCopyState("idle"), 2000);
      })
      .catch(() => {
        setCopyState("error"); // On failure, show "Error" state
        setTimeout(() => setCopyState("idle"), 2000); // Reset after 2 seconds
      });
  };

  return (
    <Button
      onClick={handleCopy}
      className={cn(
        buttonVariants({ variant, size }),
        "cursor-pointer",
        className
      )} // Apply variant/size classes + any custom classes
      variant={variant}
      size={size}
      {...props}
    >
      <CopyIcon className="size-4 mr-2" /> {getCopyLabel(copyState)}
    </Button>
  );
}
