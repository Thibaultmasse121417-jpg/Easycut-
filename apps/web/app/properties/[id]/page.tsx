import { notFound } from "next/navigation";
import { prisma, PhotoKind } from "@realtystudio/db";
import { AddPhotosForm } from "./AddPhotosForm";
import { RunAnalysisButton } from "./RunAnalysisButton";

export const dynamic = "force-dynamic";

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      photos: { orderBy: { order: "asc" } },
      videos: true,
      descriptions: { orderBy: { createdAt: "desc" } },
      jobs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!property) notFound();

  const originalPhotos = property.photos.filter((photo) => photo.kind === PhotoKind.ORIGINAL);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">{property.title}</h1>
      <p className="text-sm text-neutral-500">
        {property.address}, {property.city} {property.postalCode} · {property.status}
      </p>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-medium">Photos</h2>
        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {property.photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square overflow-hidden rounded-md bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- URLs externes arbitraires en MVP */}
              <img src={photo.url} alt={photo.kind} className="h-full w-full object-cover" />
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                {photo.kind}
              </span>
            </div>
          ))}
        </div>
        <AddPhotosForm propertyId={property.id} />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-medium">Pipeline IA</h2>
        <RunAnalysisButton
          propertyId={property.id}
          photoUrls={originalPhotos.map((photo) => photo.url)}
          context={property.notes ?? undefined}
        />
        <ul className="mt-4 flex flex-col gap-1 text-sm">
          {property.jobs.map((job) => (
            <li key={job.id} className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2">
              <span>{job.type}</span>
              <span className="text-neutral-500">{job.status}</span>
            </li>
          ))}
          {property.jobs.length === 0 && (
            <li className="text-neutral-500">Aucun traitement lancé pour ce bien.</li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-medium">Vidéos</h2>
        {property.videos.length === 0 && <p className="text-sm text-neutral-500">Aucune vidéo générée.</p>}
        {property.videos.map((video) => (
          <video key={video.id} src={video.url} controls className="mb-2 w-full rounded-md" />
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-medium">Descriptif</h2>
        {property.descriptions.length === 0 && (
          <p className="text-sm text-neutral-500">Aucun descriptif généré.</p>
        )}
        {property.descriptions[0] && (
          <p className="whitespace-pre-line rounded-md border border-neutral-200 bg-white p-4 text-sm">
            {property.descriptions[0].content}
          </p>
        )}
      </section>
    </main>
  );
}
