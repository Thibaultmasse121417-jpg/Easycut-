import { getReplicateClient } from "./clients";
import type { VirtualStagingInput, VirtualStagingResult } from "./types";

/**
 * Habillage virtuel d'une pièce vide. Modèle déjà testé par le fondateur sur
 * Replicate : proplabs/virtual-staging (voir REPLICATE_STAGING_MODEL).
 */
export async function virtualStage(
  input: VirtualStagingInput
): Promise<VirtualStagingResult> {
  const replicate = getReplicateClient();
  const model = process.env.REPLICATE_STAGING_MODEL;
  if (!model) throw new Error("REPLICATE_STAGING_MODEL manquant");

  const output = await replicate.run(model as `${string}/${string}`, {
    input: {
      image: input.photoUrl,
      room_type: input.roomType,
      style: input.style,
    },
  });

  const stagedPhotoUrl = Array.isArray(output) ? output[0] : output;
  if (typeof stagedPhotoUrl !== "string") {
    throw new Error("Sortie inattendue du modèle de staging virtuel");
  }

  return { stagedPhotoUrl };
}
