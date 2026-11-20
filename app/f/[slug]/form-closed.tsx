import { FormThemeMode } from "@prisma/client";

import { cn } from "@/lib/utils";
import { DEFAULT_CLOSED_MESSAGE } from "@/lib/screen-format";
import { FormattedText } from "@/components/form-renderer/formatted-text";

export function FormClosed({
  title,
  themeMode,
  message,
}: {
  title: string;
  themeMode: FormThemeMode;
  message?: string | null;
}) {
  return (
    <div className={cn(themeMode === FormThemeMode.DARK && "dark")}>
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <FormattedText
            text={message?.trim() || DEFAULT_CLOSED_MESSAGE}
            className="mt-3 text-muted-foreground"
          />
        </div>
      </main>
    </div>
  );
}
