import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Poll depuis l'UI pour suivre l'avancement d'un job (PENDING → PROCESSING → DONE/FAILED). */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) {
    return NextResponse.json({ error: "Job introuvable" }, { status: 404 });
  }
  return NextResponse.json(job);
}
