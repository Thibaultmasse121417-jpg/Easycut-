import { JobType } from "@realtystudio/db";

/**
 * Config de pricing — PROPOSITION INITIALE, pas encore validée sur les coûts
 * réels Claude/Replicate observés en usage. Facile à ajuster : tout est
 * centralisé ici, rien n'est codé en dur ailleurs.
 *
 * Principe : 1 crédit ≈ 1 €, pour que la table reste lisible côté agence.
 * Un abonnement mensuel inclut un quota de crédits ; des recharges à
 * l'unité sont possibles entre deux renouvellements.
 */

export const CREDIT_COST: Record<JobType, number> = {
  // Étape interne (analyse + storyboard) : offerte, car son résultat sert à
  // la fois la vidéo et le descriptif, qui sont eux facturés séparément.
  PHOTO_ANALYSIS: 0,
  VIDEO_GENERATION: 10,
  DESCRIPTION_GENERATION: 2,
  // Staging et retouche sont facturés à la photo : un job = une photo.
  VIRTUAL_STAGING: 3,
  PHOTO_ENHANCEMENT: 1,
  LANDING_PAGE_GENERATION: 5,
};

export interface Plan {
  id: string;
  name: string;
  priceEUR: number;
  creditsIncluded: number;
  /** Ce que le quota permet en usage typique, pour la page pricing. */
  highlight: string;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceEUR: 49,
    creditsIncluded: 50,
    highlight: "~5 vidéos/mois",
  },
  {
    id: "pro",
    name: "Pro",
    priceEUR: 129,
    creditsIncluded: 150,
    highlight: "~15 vidéos/mois",
  },
  {
    id: "agence",
    name: "Agence",
    priceEUR: 249,
    creditsIncluded: 350,
    highlight: "~35 vidéos/mois, plusieurs utilisateurs",
  },
];

/** Recharge de crédits à l'unité, hors renouvellement d'abonnement. */
export const CREDIT_TOPUP = {
  creditsAmount: 50,
  priceEUR: 45,
};
