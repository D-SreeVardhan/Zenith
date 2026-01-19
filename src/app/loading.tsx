import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}
