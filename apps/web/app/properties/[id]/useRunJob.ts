"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JobType } from "@realtystudio/db";

/**
 * Logique partagée par les boutons qui lancent un job IA sur un bien
 * (analyse photo, génération vidéo, descriptif...) : POST, gestion de
 * l'erreur 402 "crédits insuffisants", et rafraîchissement de la page une
 * fois le job créé (le statut s'affiche ensuite via JobsPoller).
 */
export function useRunJob(propertyId: string) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(type: JobType, input: unknown) {
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/properties/${propertyId}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, input }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(
        response.status === 402
          ? `Crédits insuffisants (${body?.creditsRequired} requis, ${body?.creditsAvailable} disponibles).`
          : "Impossible de lancer le traitement."
      );
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.refresh();
  }

  return { run, submitting, error };
}
