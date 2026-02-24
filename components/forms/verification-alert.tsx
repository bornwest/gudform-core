import { CheckCircle2, AlertTriangle } from "lucide-react";

interface VerificationAlertProps {
  verified?: string;
  error?: string;
}

const errorMessages: Record<string, string> = {
  "expired-token": "Verification link has expired. Please register again.",
  "invalid-token": "Invalid verification link. Please register again.",
  "missing-token": "Verification link is missing. Please register again.",
};

export function VerificationAlert({ verified, error }: VerificationAlertProps) {
  if (verified === "true") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
        <CheckCircle2 className="size-4 shrink-0" />
        <span>Email verified successfully! You can now sign in.</span>
      </div>
    );
  }

  if (error) {
    const message = errorMessages[error] || "Something went wrong. Please try again.";
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        <AlertTriangle className="size-4 shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  return null;
}
