import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ShellLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <LoadingSpinner size="md" />
    </div>
  );
}
