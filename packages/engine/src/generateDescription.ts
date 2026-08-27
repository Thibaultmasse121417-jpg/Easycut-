import { getAnthropicClient } from "./clients";
import type { GenerateDescriptionInput } from "./types";

/**
 * Génère le descriptif du bien (texte prêt à publier) à partir de l'analyse
 * photo (si disponible) et des infos saisies manuellement par l'agent.
 */
export async function generateDescription(
  input: GenerateDescriptionInput
): Promise<string> {
  const client = getAnthropicClient();
  const { manualInfo, analysis, tone } = input;

  const effectiveTone = tone ?? analysis?.suggestedTone ?? "standard";
  const toneInstructions: Record<string, string> = {
    standard: "Ton chaleureux et vendeur, typique d'une annonce d'agence immobilière.",
    luxe: "Ton haut de gamme, sobre et qualitatif, sans superlatifs excessifs.",
    succession:
      "Ton factuel et respectueux, adapté à une vente de succession pour une étude notariale — pas de tournures trop commerciales.",
  };

  const facts = [
    manualInfo.title && `Titre : ${manualInfo.title}`,
    manualInfo.address && `Adresse : ${manualInfo.address}`,
    manualInfo.price && `Prix : ${manualInfo.price} €`,
    manualInfo.surface && `Surface : ${manualInfo.surface} m²`,
    manualInfo.rooms && `Pièces : ${manualInfo.rooms}`,
    manualInfo.notes && `Notes de l'agent : ${manualInfo.notes}`,
    analysis?.highlights.length
      ? `Points forts détectés sur les photos : ${analysis.highlights.join(", ")}`
      : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          "Rédige le descriptif de vente de ce bien immobilier, en français, prêt à publier.",
          toneInstructions[effectiveTone],
          "3 à 5 paragraphes courts. Ne mentionne pas ces instructions dans ta réponse, renvoie uniquement le descriptif.",
          "",
          facts,
        ].join("\n"),
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude n'a pas renvoyé de texte");
  }
  return textBlock.text.trim();
}
