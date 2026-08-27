import { prisma, PhotoKind, type Job } from "@realtystudio/db";
import { enhancePhoto, type PhotoEnhancementInput } from "@realtystudio/engine";

interface PhotoEnhancementJobInput extends PhotoEnhancementInput {
  /** id de la Photo ORIGINAL retouchée. */
  sourcePhotoId: string;
}

export async function processPhotoEnhancement(job: Job) {
  if (!job.propertyId) throw new Error("job PHOTO_ENHANCEMENT sans propertyId");
  const input = job.input as unknown as PhotoEnhancementJobInput;

  const { enhancedPhotoUrl } = await enhancePhoto(input);

  await prisma.photo.create({
    data: {
      propertyId: job.propertyId,
      url: enhancedPhotoUrl,
      kind: PhotoKind.ENHANCED,
      sourcePhotoId: input.sourcePhotoId,
    },
  });

  return { enhancedPhotoUrl };
}
