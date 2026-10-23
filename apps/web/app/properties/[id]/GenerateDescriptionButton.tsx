"use client";

import type { PhotoAnalysisResult } from "@realtystudio/engine";
import { useRunJob } from "./useRunJob";

/**
 * Lance DESCRIPTION_GENERATION. L'analyse photo (PHOTO_ANALYSIS) est
 * optionnelle ici : un descriptif peut être régénéré (ex: changement de ton)
 * sans ré-analyser les photos — voir packages/engine.generateDescription.
 */
export function GenerateDescriptionButton({
  propertyId,
  photoUrls,
  analysis,
  manualInfo,
}: {
  propertyId: string;
  photoUrls: string[];
  analysis: PhotoAnalysisResult | null;
  manualInfo: {
    title?: string;
    address?: string;
    price?: number;
    surface?: number;
    rooms?: number;
    notes?: string;
  };
}) {
  const { run, submitting, error } = useRunJob(propertyId);

  return (
    <div>
      <button
        onClick={() =>
          run("DESCRIPTION_GENERATION", {
            photos: photoUrls.map((url) => ({ url })),
            analysis: analysis ?? undefined,
            manualInfo,
          })
        }
        disabled={submitting}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Lancement..." : "Générer le descriptif"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
