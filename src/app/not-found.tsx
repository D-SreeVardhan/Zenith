import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-elevated">
        <span className="text-4xl font-bold text-text-muted">404</span>
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-text-primary">
        Page Not Found
      </h1>
      <p className="mb-6 max-w-md text-sm text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="btn-primary inline-flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Go Home
      </Link>
    </div>
  );
}
