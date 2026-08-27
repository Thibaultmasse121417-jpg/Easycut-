"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * MVP : ajout de photos par URL (une par ligne) en attendant le vrai widget
 * d'upload vers le stockage S3-compatible (voir app/api/properties/[id]/photos/route.ts).
 */
export function AddPhotosForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const urls = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (urls.length === 0) return;

    setSubmitting(true);
    await fetch(`/api/properties/${propertyId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });
    setValue("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Une URL de photo par ligne"
        rows={4}
        className="rounded-md border border-neutral-300 p-2 text-sm"
      />
      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Ajout..." : "Ajouter les photos"}
      </button>
    </form>
  );
}
