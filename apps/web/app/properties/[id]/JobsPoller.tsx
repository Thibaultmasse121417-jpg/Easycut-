"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Tant qu'un job du bien est PENDING/PROCESSING, rafraîchit la page toutes
 * les 4s pour refléter son avancement sans action de l'utilisateur. S'arrête
 * tout seul dès que plus aucun job n'est actif (le composant est démonté par
 * le parent au prochain rendu si `active` passe à false).
 */
export function JobsPoller({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [active, router]);

  return null;
}
