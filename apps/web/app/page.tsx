import Link from "next/link";

const FEATURES = [
  {
    title: "Vidéo courte du bien",
    description:
      "Vos photos deviennent une vidéo Reels/TikTok/Shorts prête à publier, en quelques minutes.",
  },
  {
    title: "Descriptif automatique",
    description:
      "Un texte de vente généré à partir des photos et des infos du bien, prêt à coller dans votre annonce.",
  },
  {
    title: "Staging virtuel",
    description: "Habillez les pièces vides sans déplacer le moindre meuble.",
  },
  {
    title: "Publication au nom de l'agence",
    description:
      "Diffusez sur Facebook, Instagram et TikTok depuis les comptes de l'agence — jamais ceux du propriétaire.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-16 px-6 py-24">
      <section className="flex flex-col gap-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          Pour agences immobilières &amp; notaires
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Des photos de bien à la vidéo qui vend, sans quitter votre bureau.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-neutral-600">
          RealtyStudio transforme les photos d&apos;un bien en vidéo courte, descriptif
          et fiche prête à publier — au compte de votre agence, jamais celui du
          propriétaire.
        </p>
        <Link href="/pricing" className="mx-auto text-sm font-medium underline">
          Voir les tarifs
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-neutral-600">{feature.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
