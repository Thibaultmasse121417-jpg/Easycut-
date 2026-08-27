"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Lance le job PHOTO_ANALYSIS (étape 1 du pipeline — voir packages/engine).
 * Une fois DONE, la fiche du bien expose ensuite les boutons "Générer la
 * vidéo" et "Générer le descriptif" à partir de son résultat.
 *
 * L'analyse est offerte (0 crédit — voir packages/pricing), mais la gestion
 * d'erreur "crédits insuffisants" (402) est câblée ici pour servir de modèle
 * aux prochains boutons (génération vidéo, descriptif...), qui eux sont
 * facturés.
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
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/properties/${propertyId}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PHOTO_ANALYSIS",
        input: { photos: photoUrls.map((url) => ({ url })), context },
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(
        response.status === 402
          ? `Crédits insuffisants (${body?.creditsRequired} requis, ${body?.creditsAvailable} disponibles).`
          : "Impossible de lancer le traitement."
      );
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={submitting || photoUrls.length === 0}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Lancement..." : "Analyser les photos"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
