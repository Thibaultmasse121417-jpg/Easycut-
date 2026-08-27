import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * MVP : accepte des URLs de photos déjà hébergées (pas d'upload binaire ici).
 * TODO (Phase 0) : remplacer par un vrai upload vers le stockage S3-compatible
 * (Cloudflare R2) — voir STORAGE_* dans .env.example — avec une URL de upload
 * signée générée côté serveur.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) {
    return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const urls: string[] = Array.isArray(body.urls) ? body.urls : [];
  if (urls.length === 0) {
    return NextResponse.json({ error: "Aucune URL fournie" }, { status: 400 });
  }

  const existingCount = await prisma.photo.count({ where: { propertyId: property.id } });

  const photos = await prisma.$transaction(
    urls.map((url, index) =>
      prisma.photo.create({
        data: { propertyId: property.id, url, order: existingCount + index },
      })
    )
  );

  return NextResponse.json(photos, { status: 201 });
}
