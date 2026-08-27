import { prisma, type Job } from "@realtystudio/db";
import { generateVideoClips, type GenerateVideoInput } from "@realtystudio/engine";
import { stitchClips } from "../ffmpeg";

export async function processVideoGeneration(job: Job) {
  if (!job.propertyId) throw new Error("job VIDEO_GENERATION sans propertyId");
  const input = job.input as unknown as GenerateVideoInput;

  const { clips } = await generateVideoClips(input);
  const orderedUrls = [...clips].sort((a, b) => a.sceneOrder - b.sceneOrder).map((c) => c.videoUrl);
  const finalVideoUrl = await stitchClips(orderedUrls);

  await prisma.video.create({
    data: {
      propertyId: job.propertyId,
      jobId: job.id,
      url: finalVideoUrl,
    },
  });

  return { clips, finalVideoUrl };
}
