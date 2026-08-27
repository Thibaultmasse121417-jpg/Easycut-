import { getAnthropicClient } from "./clients";
import type { AnalyzePhotosInput, PhotoAnalysisResult } from "./types";

/**
 * Étape 1 du pipeline : Claude regarde les photos du bien et produit :
 *  - une liste de points forts (réutilisée par generateDescription)
 *  - un storyboard ordonné (réutilisé par generateVideo)
 *
 * C'est l'étape commune aux deux livrables "vidéo" et "descriptif" — on ne
 * fait analyser les photos qu'une seule fois.
 */
export async function analyzePhotos(
  input: AnalyzePhotosInput
): Promise<PhotoAnalysisResult> {
  const client = getAnthropicClient();

  const storyboardTool = {
    name: "submit_photo_analysis",
    description: "Renvoie l'analyse structurée des photos du bien.",
    input_schema: {
      type: "object" as const,
      properties: {
        highlights: {
          type: "array",
          items: { type: "string" },
          description: "Points forts du bien visibles sur les photos (3 à 6 éléments courts).",
        },
        roomsDetected: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              photoUrl: { type: "string" },
            },
            required: ["label", "photoUrl"],
          },
        },
        storyboard: {
          type: "array",
          description: "Ordre des plans pour la vidéo, une entrée par photo utilisée.",
          items: {
            type: "object",
            properties: {
              photoUrl: { type: "string" },
              order: { type: "integer" },
              shotType: {
                type: "string",
                enum: ["establishing", "detail", "transition", "closing"],
              },
              durationSeconds: { type: "number" },
              voiceoverLine: { type: "string" },
              cameraMotion: {
                type: "string",
                description: "Instruction courte pour un modèle image-to-video, ex: 'slow zoom in', 'pan left to right'.",
              },
            },
            required: ["photoUrl", "order", "shotType", "durationSeconds", "cameraMotion"],
          },
        },
        suggestedTone: {
          type: "string",
          enum: ["standard", "luxe", "succession"],
        },
      },
      required: ["highlights", "roomsDetected", "storyboard", "suggestedTone"],
    },
  };

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    tools: [storyboardTool],
    tool_choice: { type: "tool", name: "submit_photo_analysis" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "Tu es un monteur vidéo et rédacteur immobilier expérimenté.",
              "Analyse ces photos d'un bien immobilier et prépare :",
              "1. Les points forts du bien (pour un descriptif de vente).",
              "2. Un storyboard vidéo courte (style Reel/TikTok, 20-40s au total) : ordre des plans,",
              "   type de plan, mouvement de caméra suggéré pour chaque photo.",
              input.context ? `Contexte fourni par l'agence : ${input.context}` : "",
            ]
              .filter(Boolean)
              .join("\n"),
          },
          ...input.photos.map((photo) => ({
            type: "image" as const,
            source: { type: "url" as const, url: photo.url },
          })),
        ],
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude n'a pas renvoyé d'analyse structurée");
  }

  return toolUse.input as PhotoAnalysisResult;
}
