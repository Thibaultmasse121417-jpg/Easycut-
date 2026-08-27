import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentAgency } from "@/lib/currentAgency";

// Données lues à chaque requête (jamais prérendu statiquement) : ce
// dashboard reflète l'état courant des biens/jobs en base.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const agency = await getCurrentAgency();

  const properties = agency
    ? await prisma.property.findMany({
        where: { agencyId: agency.id },
        orderBy: { createdAt: "desc" },
        include: { videos: true, descriptions: true },
      })
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vos biens</h1>
          {agency && (
            <p className="mt-1 text-sm text-neutral-500">
              {agency.creditBalance} crédits disponibles ·{" "}
              <Link href="/pricing" className="underline">
                recharger
              </Link>
            </p>
          )}
        </div>
        <Link
          href="/properties/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          + Nouveau bien
        </Link>
      </div>

      {!agency && (
        <p className="text-sm text-neutral-500">
          Aucune agence en base — voir README pour amorcer une agence de test
          (script de seed à venir).
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/properties/${property.id}`}
            className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
          >
            <p className="font-medium">{property.title}</p>
            <p className="text-sm text-neutral-500">
              {property.city} · {property.status}
            </p>
            <div className="mt-3 flex gap-2 text-xs text-neutral-500">
              <span>{property.videos.length} vidéo(s)</span>
              <span>·</span>
              <span>{property.descriptions.length} descriptif(s)</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
