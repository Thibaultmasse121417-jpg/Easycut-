// Types du moteur IA. Volontairement génériques (pas de "agence", "notaire", etc.)
// pour rester réutilisables par le Produit 1 (Reelty) plus tard.

export interface SourcePhoto {
  url: string;
  /** Étiquette libre optionnelle, ex: "cuisine", "façade" — aide le storyboard. */
  label?: string;
}

export type ShotType = "establishing" | "detail" | "transition" | "closing";

export interface StoryboardScene {
  photoUrl: string;
  order: number;
  shotType: ShotType;
  durationSeconds: number;
  /** Ligne de voix-off / sous-titre suggérée pour ce plan (peut être vide). */
  voiceoverLine?: string;
  /** Instruction de mouvement de caméra à passer au modèle image-to-video (Kling). */
  cameraMotion: string;
}

export interface PhotoAnalysisResult {
  /** Points forts du bien détectés à partir des photos (pour descriptif ET storyboard). */
  highlights: string[];
  roomsDetected: { label: string; photoUrl: string }[];
  storyboard: StoryboardScene[];
  suggestedTone: "standard" | "luxe" | "succession";
}

export interface AnalyzePhotosInput {
  photos: SourcePhoto[];
  /** Contexte libre optionnel fourni par l'utilisateur (type de bien, ambiance recherchée...). */
  context?: string;
}

export interface GenerateDescriptionInput {
  photos: SourcePhoto[];
  analysis?: PhotoAnalysisResult;
  manualInfo: {
    title?: string;
    address?: string;
    price?: number;
    surface?: number;
    rooms?: number;
    notes?: string;
  };
  tone?: "standard" | "luxe" | "succession";
}

export interface GenerateVideoInput {
  storyboard: StoryboardScene[];
}

export interface GenerateVideoResult {
  /** Un clip généré par plan du storyboard (avant montage). */
  clips: { sceneOrder: number; videoUrl: string }[];
  /**
   * Vidéo finale après montage (concaténation + transitions).
   * Le montage lui-même (ffmpeg) est fait par le worker, pas par cette fonction —
   * voir apps/worker/src/processors/videoGeneration.ts.
   */
  finalVideoUrl?: string;
}

export interface VirtualStagingInput {
  photoUrl: string;
  roomType?: string;
  style?: string;
}

export interface VirtualStagingResult {
  stagedPhotoUrl: string;
}

export interface PhotoEnhancementInput {
  photoUrl: string;
}

export interface PhotoEnhancementResult {
  beforeUrl: string;
  enhancedPhotoUrl: string;
}
