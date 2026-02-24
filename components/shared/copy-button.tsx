"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Icons } from "./icons";

interface CopyButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function CopyButton({ value, className, ...props }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      className={cn(
        "z-10 size-[30px] border border-gray-300 bg-gray-100 p-1.5 text-gray-600 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-gray-100",
        className,
      )}
      onClick={() => handleCopyValue(value)}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? (
        <Icons.check className="size-4" />
      ) : (
        <Icons.copy className="size-4" />
      )}
    </Button>
  );
}
