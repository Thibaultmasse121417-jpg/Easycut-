"use client";

import type { StoryboardScene } from "@realtystudio/engine";
import { useRunJob } from "./useRunJob";

/**
 * Lance VIDEO_GENERATION à partir du storyboard produit par le job
 * PHOTO_ANALYSIS le plus récent (voir packages/engine.generateVideoClips).
 */
export function GenerateVideoButton({
  propertyId,
  storyboard,
}: {
  propertyId: string;
  storyboard: StoryboardScene[] | null;
}) {
  const { run, submitting, error } = useRunJob(propertyId);

  return (
    <div>
      <button
        onClick={() => storyboard && run("VIDEO_GENERATION", { storyboard })}
        disabled={submitting || !storyboard}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        title={storyboard ? undefined : "Lance d'abord l'analyse des photos"}
      >
        {submitting ? "Lancement..." : "Générer la vidéo"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
