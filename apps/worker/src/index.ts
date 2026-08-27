import { prisma, JobStatus, JobType, type Job } from "@realtystudio/db";
import { CREDIT_COST } from "@realtystudio/pricing";
import { processPhotoAnalysis } from "./processors/photoAnalysis";
import { processVideoGeneration } from "./processors/videoGeneration";
import { processDescriptionGeneration } from "./processors/descriptionGeneration";
import { processVirtualStaging } from "./processors/virtualStaging";
import { processPhotoEnhancement } from "./processors/photoEnhancement";

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 5000);

// MVP : un worker, un job à la fois, polling Postgres. Suffisant tant que le
// volume reste faible ; à remplacer par une vraie file (BullMQ + Redis) si le
// débit de jobs devient un goulot d'étranglement.
const processors: Record<JobType, (job: Job) => Promise<unknown>> = {
  PHOTO_ANALYSIS: processPhotoAnalysis,
  VIDEO_GENERATION: processVideoGeneration,
  DESCRIPTION_GENERATION: processDescriptionGeneration,
  VIRTUAL_STAGING: processVirtualStaging,
  PHOTO_ENHANCEMENT: processPhotoEnhancement,
  LANDING_PAGE_GENERATION: async () => {
    throw new Error("LANDING_PAGE_GENERATION pas encore implémenté (Phase 3)");
  },
};

async function tick(): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { status: JobStatus.PENDING },
    orderBy: { createdAt: "asc" },
  });
  if (!job) return;

  await prisma.job.update({
    where: { id: job.id },
    data: { status: JobStatus.PROCESSING, startedAt: new Date(), attempts: { increment: 1 } },
  });

  try {
    const output = await processors[job.type](job);
    await prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.DONE, output: output as never, finishedAt: new Date() },
    });
    console.log(`[worker] job ${job.id} (${job.type}) terminé`);
  } catch (error) {
    console.error(`[worker] job ${job.id} (${job.type}) en échec`, error);
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
        finishedAt: new Date(),
      },
    });
    await refundCredits(job);
  }
}

/**
 * Le job a été facturé à la création (voir apps/web .../jobs/route.ts) ; s'il
 * échoue, on rembourse les crédits consommés pour ne pas facturer un
 * traitement qui n'a rien produit.
 */
async function refundCredits(job: Job): Promise<void> {
  const cost = CREDIT_COST[job.type];
  if (cost <= 0) return;

  await prisma.$transaction([
    prisma.agency.update({
      where: { id: job.agencyId },
      data: { creditBalance: { increment: cost } },
    }),
    prisma.creditTransaction.create({
      data: {
        agencyId: job.agencyId,
        amount: cost,
        reason: "REFUND",
        jobId: job.id,
        description: `Remboursement — job ${job.type} en échec`,
      },
    }),
  ]);
}

async function main(): Promise<void> {
  console.log(`[worker] démarré, polling toutes les ${POLL_INTERVAL_MS}ms`);
  for (;;) {
    await tick();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main().catch((error) => {
  console.error("[worker] erreur fatale", error);
  process.exit(1);
});
