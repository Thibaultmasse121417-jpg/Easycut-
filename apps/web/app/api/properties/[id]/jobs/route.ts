import { NextResponse } from "next/server";
import { prisma, JobType } from "@realtystudio/db";
import { CREDIT_COST } from "@realtystudio/pricing";

/**
 * Crée un job pour un bien (analyse photos, génération vidéo, descriptif,
 * staging, retouche...). Le worker (apps/worker) le dépilera. `input` doit
 * correspondre à la forme attendue par @realtystudio/engine pour ce type de
 * job — voir packages/engine/src/types.ts.
 *
 * Débite le coût en crédits (packages/pricing) de l'agence de façon atomique
 * avec la création du job, pour ne jamais lancer un traitement payant sans
 * l'avoir facturé. En cas d'échec du job, le worker rembourse — voir
 * apps/worker/src/index.ts.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) {
    return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const type = body.type as JobType;
  if (!Object.values(JobType).includes(type)) {
    return NextResponse.json({ error: "Type de job invalide" }, { status: 400 });
  }

  const cost = CREDIT_COST[type];

  try {
    const job = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.findUniqueOrThrow({ where: { id: property.agencyId } });
      if (agency.creditBalance < cost) {
        throw new InsufficientCreditsError(cost, agency.creditBalance);
      }

      const createdJob = await tx.job.create({
        data: {
          agencyId: property.agencyId,
          propertyId: property.id,
          type,
          input: body.input ?? {},
        },
      });

      if (cost > 0) {
        await tx.agency.update({
          where: { id: property.agencyId },
          data: { creditBalance: { decrement: cost } },
        });
        await tx.creditTransaction.create({
          data: {
            agencyId: property.agencyId,
            amount: -cost,
            reason: "CONSUMPTION",
            jobId: createdJob.id,
            description: `Job ${type}`,
          },
        });
      }

      return createdJob;
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: "Crédits insuffisants",
          creditsRequired: error.required,
          creditsAvailable: error.available,
        },
        { status: 402 }
      );
    }
    throw error;
  }
}

class InsufficientCreditsError extends Error {
  constructor(public required: number, public available: number) {
    super("Crédits insuffisants");
  }
}
