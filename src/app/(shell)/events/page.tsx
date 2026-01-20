"use client";

export const dynamic = 'force-dynamic';

import { EventList } from "@/components/events/EventList";

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <EventList />
    </div>
  );
}
