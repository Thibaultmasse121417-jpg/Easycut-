import { NextResponse } from "next/server";
import { prisma, JobType } from "@realtystudio/db";

/**
 * Crée un job pour un bien (analyse photos, génération vidéo, descriptif,
 * staging, retouche...). Le worker (apps/worker) le dépilera. `input` doit
 * correspondre à la forme attendue par @realtystudio/engine pour ce type de
 * job — voir packages/engine/src/types.ts.
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

  const job = await prisma.job.create({
    data: {
      agencyId: property.agencyId,
      propertyId: property.id,
      type,
      input: body.input ?? {},
    },
  });

  return NextResponse.json(job, { status: 201 });
}
