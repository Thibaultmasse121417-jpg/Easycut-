import { getReplicateClient } from "./clients";
import type { GenerateVideoInput, GenerateVideoResult } from "./types";

/**
 * Transforme chaque plan du storyboard en clip vidéo via un modèle
 * image-to-video (Kling, sur Replicate). Le montage final (concaténation,
 * transitions, musique) est fait par le worker via ffmpeg — voir
 * apps/worker/src/processors/videoGeneration.ts — donc `finalVideoUrl`
 * n'est PAS rempli ici.
 */
export async function generateVideoClips(
  input: GenerateVideoInput
): Promise<GenerateVideoResult> {
  const replicate = getReplicateClient();
  const model = process.env.REPLICATE_VIDEO_MODEL;
  if (!model) throw new Error("REPLICATE_VIDEO_MODEL manquant");

  const sortedScenes = [...input.storyboard].sort((a, b) => a.order - b.order);

  const clips = await Promise.all(
    sortedScenes.map(async (scene) => {
      const output = await replicate.run(model as `${string}/${string}`, {
        input: {
          image: scene.photoUrl,
          prompt: scene.cameraMotion,
          duration: scene.durationSeconds,
        },
      });

      // Les modèles vidéo Replicate renvoient en général une URL (string) ou
      // un tableau contenant une URL — on normalise ici.
      const videoUrl = Array.isArray(output) ? output[0] : output;
      if (typeof videoUrl !== "string") {
        throw new Error(`Sortie inattendue du modèle vidéo pour le plan ${scene.order}`);
      }

      return { sceneOrder: scene.order, videoUrl };
    })
  );

  return { clips };
}
