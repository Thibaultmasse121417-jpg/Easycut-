import { prisma, PhotoKind, type Job } from "@realtystudio/db";
import { virtualStage, type VirtualStagingInput } from "@realtystudio/engine";

interface VirtualStagingJobInput extends VirtualStagingInput {
  /** id de la Photo ORIGINAL sur laquelle se base le staging. */
  sourcePhotoId: string;
}

export async function processVirtualStaging(job: Job) {
  if (!job.propertyId) throw new Error("job VIRTUAL_STAGING sans propertyId");
  const input = job.input as unknown as VirtualStagingJobInput;

  const { stagedPhotoUrl } = await virtualStage(input);

  await prisma.photo.create({
    data: {
      propertyId: job.propertyId,
      url: stagedPhotoUrl,
      kind: PhotoKind.STAGED,
      sourcePhotoId: input.sourcePhotoId,
    },
  });

  return { stagedPhotoUrl };
}
