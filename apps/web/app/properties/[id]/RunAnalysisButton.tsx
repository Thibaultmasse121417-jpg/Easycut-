"use client";

import { useRunJob } from "./useRunJob";

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
  const { run, submitting, error } = useRunJob(propertyId);

  return (
    <div>
      <button
        onClick={() =>
          run("PHOTO_ANALYSIS", { photos: photoUrls.map((url) => ({ url })), context })
        }
        disabled={submitting || photoUrls.length === 0}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Lancement..." : "Analyser les photos"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
