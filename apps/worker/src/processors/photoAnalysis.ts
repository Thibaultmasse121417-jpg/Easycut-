import type { Job } from "@realtystudio/db";
import { analyzePhotos, type AnalyzePhotosInput } from "@realtystudio/engine";

/**
 * Étape commune préalable à la vidéo ET au descriptif. Le résultat est stocké
 * dans job.output ; les jobs VIDEO_GENERATION / DESCRIPTION_GENERATION créés
 * ensuite depuis l'UI passent ce résultat en entrée pour éviter de ré-analyser
 * les photos deux fois.
 */
export async function processPhotoAnalysis(job: Job) {
  const input = job.input as unknown as AnalyzePhotosInput;
  return analyzePhotos(input);
}
