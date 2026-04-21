"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ProjectPageStatus } from "@/lib/analysis/projects";

function statusLabel(status: ProjectPageStatus) {
  switch (status) {
    case "follow_up":
      return "Follow-up";
    case "in_review":
      return "In review";
    case "resolved":
      return "Resolved";
    default:
      return "No state";
  }
}

export function ProjectPageStatusActions({
  projectId,
  url,
  status,
}: {
  projectId: string;
  url: string;
  status: ProjectPageStatus;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function updateStatus(nextStatus: ProjectPageStatus) {
    if (isSaving || nextStatus === status) return;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/pages`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, status: nextStatus }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Could not update page state.");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  const buttons: ProjectPageStatus[] = ["follow_up", "in_review", "resolved", "none"];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-400">
        {isSaving ? "Saving..." : statusLabel(status)}
      </span>
      {buttons.map((nextStatus) => (
        <button
          key={nextStatus}
          type="button"
          onClick={() => void updateStatus(nextStatus)}
          disabled={isSaving || nextStatus === status}
          className="rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {statusLabel(nextStatus)}
        </button>
      ))}
    </div>
  );
}
