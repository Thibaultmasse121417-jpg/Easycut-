import { CREDIT_COST, CREDIT_TOPUP, PLANS } from "@realtystudio/pricing";

const JOB_LABELS: Record<string, string> = {
  PHOTO_ANALYSIS: "Analyse des photos (offerte, préalable à vidéo/descriptif)",
  VIDEO_GENERATION: "Génération vidéo",
  DESCRIPTION_GENERATION: "Descriptif du bien",
  VIRTUAL_STAGING: "Staging virtuel (par photo)",
  PHOTO_ENHANCEMENT: "Retouche photo (par photo)",
  LANDING_PAGE_GENERATION: "Site épuré par bien",
};

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Tarifs</h1>
      <p className="mt-2 text-neutral-600">
        Un abonnement mensuel avec un quota de crédits. Chaque traitement IA
        consomme des crédits selon la table ci-dessous — 1 crédit ≈ 1 €.
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        Proposition initiale, à ajuster selon les coûts observés en usage réel.
      </p>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-medium">Abonnements</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Prix / mois</th>
                <th className="px-4 py-3 font-medium">Crédits inclus</th>
                <th className="px-4 py-3 font-medium">Repère</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {PLANS.map((plan) => (
                <tr key={plan.id}>
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="px-4 py-3">{plan.priceEUR} €</td>
                  <td className="px-4 py-3">{plan.creditsIncluded} crédits</td>
                  <td className="px-4 py-3 text-neutral-500">{plan.highlight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Recharge à l&apos;unité entre deux renouvellements : {CREDIT_TOPUP.creditsAmount}{" "}
          crédits pour {CREDIT_TOPUP.priceEUR} €.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-medium">Coût par action</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Coût</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {Object.entries(CREDIT_COST).map(([type, cost]) => (
                <tr key={type}>
                  <td className="px-4 py-3">{JOB_LABELS[type] ?? type}</td>
                  <td className="px-4 py-3">{cost === 0 ? "Offert" : `${cost} crédits`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
