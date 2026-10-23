import { notFound } from "next/navigation";
import { prisma, PhotoKind, JobStatus, JobType } from "@realtystudio/db";
import type { PhotoAnalysisResult } from "@realtystudio/engine";
import { AddPhotosForm } from "./AddPhotosForm";
import { RunAnalysisButton } from "./RunAnalysisButton";
import { GenerateVideoButton } from "./GenerateVideoButton";
import { GenerateDescriptionButton } from "./GenerateDescriptionButton";
import { JobsPoller } from "./JobsPoller";

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

  const latestAnalysisJob = property.jobs.find(
    (job) => job.type === JobType.PHOTO_ANALYSIS && job.status === JobStatus.DONE
  );
  const analysis = (latestAnalysisJob?.output as unknown as PhotoAnalysisResult | undefined) ?? null;

  const hasActiveJob = property.jobs.some(
    (job) => job.status === JobStatus.PENDING || job.status === JobStatus.PROCESSING
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <JobsPoller active={hasActiveJob} />

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
        <div className="flex flex-wrap gap-3">
          <RunAnalysisButton
            propertyId={property.id}
            photoUrls={originalPhotos.map((photo) => photo.url)}
            context={property.notes ?? undefined}
          />
          <GenerateVideoButton
            propertyId={property.id}
            storyboard={analysis?.storyboard ?? null}
          />
          <GenerateDescriptionButton
            propertyId={property.id}
            photoUrls={originalPhotos.map((photo) => photo.url)}
            analysis={analysis}
            manualInfo={{
              title: property.title,
              address: `${property.address}, ${property.city}`,
              price: property.price ?? undefined,
              surface: property.surface ?? undefined,
              rooms: property.rooms ?? undefined,
              notes: property.notes ?? undefined,
            }}
          />
        </div>

        {analysis && (
          <ul className="mt-4 flex flex-wrap gap-1 text-xs text-neutral-500">
            {analysis.highlights.map((highlight) => (
              <li key={highlight} className="rounded-full border border-neutral-200 px-2 py-0.5">
                {highlight}
              </li>
            ))}
          </ul>
        )}

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
