import { prisma } from "./prisma";

/**
 * TODO (Phase 0) : remplacer par la vraie session NextAuth une fois l'auth
 * branchée (voir README — Auth multi-agence). En attendant, renvoie la
 * première agence en base pour pouvoir développer/tester le reste du
 * pipeline sans bloquer sur l'auth.
 */
export async function getCurrentAgency() {
  return prisma.agency.findFirst();
}
