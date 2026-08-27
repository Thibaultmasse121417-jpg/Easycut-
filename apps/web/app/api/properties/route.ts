import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAgency } from "@/lib/currentAgency";

export async function POST(request: Request) {
  const agency = await getCurrentAgency();
  if (!agency) {
    return NextResponse.json({ error: "Aucune agence courante" }, { status: 400 });
  }

  const body = await request.json();

  const property = await prisma.property.create({
    data: {
      agencyId: agency.id,
      title: body.title,
      address: body.address,
      city: body.city,
      postalCode: body.postalCode,
      price: body.price,
      surface: body.surface,
      rooms: body.rooms,
      notes: body.notes,
    },
  });

  return NextResponse.json(property, { status: 201 });
}
