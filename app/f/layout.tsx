import "@/styles/globals.css";

import { fontHeading, fontSans, fontSatoshi } from "@/assets/fonts";

import { cn } from "@/lib/utils";

interface FormLayoutProps {
  children: React.ReactNode;
}

export default function FormLayout({ children }: FormLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen font-sans antialiased",
        fontSans.variable,
        fontHeading.variable,
        fontSatoshi.variable,
      )}
    >
      {children}
    </div>
  );
}
