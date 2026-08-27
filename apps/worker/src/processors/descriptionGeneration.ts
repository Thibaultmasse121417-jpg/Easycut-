import { prisma, type Job } from "@realtystudio/db";
import { generateDescription, type GenerateDescriptionInput } from "@realtystudio/engine";

export async function processDescriptionGeneration(job: Job) {
  if (!job.propertyId) throw new Error("job DESCRIPTION_GENERATION sans propertyId");
  const input = job.input as unknown as GenerateDescriptionInput;

  const content = await generateDescription(input);

  await prisma.generatedDescription.create({
    data: {
      propertyId: job.propertyId,
      jobId: job.id,
      content,
      tone: input.tone,
    },
  });

  return { content };
}
