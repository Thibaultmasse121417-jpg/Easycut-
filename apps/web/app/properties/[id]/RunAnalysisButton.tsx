"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Lance le job PHOTO_ANALYSIS (étape 1 du pipeline — voir packages/engine).
 * Une fois DONE, la fiche du bien expose ensuite les boutons "Générer la
 * vidéo" et "Générer le descriptif" à partir de son résultat.
 */
export function RunAnalysisButton({
  propertyId,
  photoUrls,
  context,
}: {
  propertyId: string;
  photoUrls: string[];
  context?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    await fetch(`/api/properties/${propertyId}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PHOTO_ANALYSIS",
        input: { photos: photoUrls.map((url) => ({ url })), context },
      }),
    });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={submitting || photoUrls.length === 0}
      className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
    >
      {submitting ? "Lancement..." : "Analyser les photos"}
    </button>
  );
}
