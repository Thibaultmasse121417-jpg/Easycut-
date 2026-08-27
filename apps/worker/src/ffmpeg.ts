/**
 * TODO (Phase 1) : monter les clips (concaténation + transitions + musique) avec
 * ffmpeg. Pas implémenté dans ce squelette — nécessite ffmpeg sur la machine du
 * worker (ou un service dédié type Shotstack/Remotion). En attendant, on
 * renvoie le premier clip tel quel pour ne pas bloquer le pipeline de bout en
 * bout : le montage réel est le prochain chantier une fois la génération de
 * clips validée avec Kling.
 */
export async function stitchClips(clipUrls: string[]): Promise<string> {
  if (clipUrls.length === 0) throw new Error("Aucun clip à monter");
  return clipUrls[0];
}
