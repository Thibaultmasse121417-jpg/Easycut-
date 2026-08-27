import { getReplicateClient } from "./clients";
import type { PhotoEnhancementInput, PhotoEnhancementResult } from "./types";

/**
 * Retouche / amélioration IA d'une photo existante ("Photos qui vendent").
 * Le modèle précis (upscale, relighting, correction d'exposition...) reste à
 * choisir après tests — voir REPLICATE_PHOTO_ENHANCE_MODEL dans .env.example.
 */
export async function enhancePhoto(
  input: PhotoEnhancementInput
): Promise<PhotoEnhancementResult> {
  const replicate = getReplicateClient();
  const model = process.env.REPLICATE_PHOTO_ENHANCE_MODEL;
  if (!model) throw new Error("REPLICATE_PHOTO_ENHANCE_MODEL manquant");

  const output = await replicate.run(model as `${string}/${string}`, {
    input: { image: input.photoUrl },
  });

  const enhancedPhotoUrl = Array.isArray(output) ? output[0] : output;
  if (typeof enhancedPhotoUrl !== "string") {
    throw new Error("Sortie inattendue du modèle de retouche photo");
  }

  return { beforeUrl: input.photoUrl, enhancedPhotoUrl };
}
