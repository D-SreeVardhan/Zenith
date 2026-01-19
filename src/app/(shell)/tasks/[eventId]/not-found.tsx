import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function TasksNotFound() {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
        <AlertCircle className="h-8 w-8 text-text-muted" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-text-primary">
        Event Not Found
      </h2>
      <p className="mb-6 text-sm text-text-secondary">
        The event you&apos;re looking for doesn&apos;t exist or may have been deleted.
      </p>
      <Link href="/events" className="btn-primary">
        Back to Events
      </Link>
    </div>
  );
}
