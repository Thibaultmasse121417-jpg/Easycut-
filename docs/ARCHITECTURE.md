# Architecture & priorisation — Produit 2

## 1. Modèle de données

Multi-tenant simple : une `Agency` (agence ou étude notariale) a des `User`,
des `Property` (biens), des `SocialAccount` (comptes réseaux sociaux **de
l'agence**), des `Job` (traitements IA asynchrones) et un solde de crédits
(`creditBalance` + ledger `CreditTransaction` — voir §4bis "Pricing").

```
Agency ─┬─ User
        ├─ Property ─┬─ Photo (ORIGINAL / STAGED / ENHANCED)
        │            ├─ Job (PHOTO_ANALYSIS / VIDEO_GENERATION / ...)
        │            ├─ Video
        │            ├─ GeneratedDescription
        │            ├─ LandingPage
        │            └─ Post (réseaux sociaux)
        ├─ Job
        ├─ CreditTransaction (ledger : achat / consommation / remboursement / bonus)
        └─ SocialAccount ─ Post
```

Détail complet : `packages/db/prisma/schema.prisma` (commenté).

Points de design à noter :
- `Photo.kind` distingue une photo d'origine de ses dérivés (staging,
  retouche) via `sourcePhotoId` — permet l'avant/après demandé pour
  "Photos qui vendent" sans dupliquer de logique.
- `Job` est générique (`type` + `input`/`output` en JSON) plutôt qu'une table
  par type de traitement : un seul worker, un seul modèle mental, et
  l'ajout d'un nouveau type de job (ex: visite 360°) ne touche pas le schéma.
- `Post.status` inclut `PENDING_APPROVAL` : la validation manuelle avant
  publication (exigée dans le scope) est un état, pas une case à cocher —
  ça laisse la place à un vrai écran de revue plus tard.

## 2. Pipeline IA (`packages/engine`)

```
Photos + infos saisies
        │
        ▼
 analyzePhotos()  ── Claude (vision) ──▶ highlights + storyboard + tone
        │                                        │
        ├───────────────┬────────────────────────┤
        ▼               ▼                        ▼
generateDescription  generateVideoClips     (staging / retouche : appelés
  (Claude, texte)    (Replicate/Kling,       indépendamment, par photo,
                      1 appel par plan       pas besoin d'analyse préalable)
                      du storyboard)
                            │
                            ▼
                  worker: stitchClips()
                  (ffmpeg — PAS ENCORE ÉCRIT)
```

`analyzePhotos` est appelée une seule fois par bien et sert **à la fois** la
vidéo et le descriptif (mêmes points forts détectés, pas d'incohérence entre
les deux, un seul appel Claude vision au lieu de deux). Storyboard et
descriptif peuvent ensuite être régénérés indépendamment (ex: l'agent change
le ton du descriptif) sans relancer l'analyse photo.

`virtualStage` et `enhancePhoto` sont volontairement indépendants du
storyboard : ce sont des opérations photo-à-photo, appelables à la demande
sur n'importe quelle photo, à tout moment du cycle de vie du bien.

## 3. Ordre de build (raisonnement)

L'objectif est de prouver la valeur cœur (vidéo + descriptif) avant les
fonctionnalités périphériques, et de traiter en dernier ce qui a un coût
d'intégration externe élevé (réseaux sociaux : revue d'app Meta, accès API
TikTok — délais hors de notre contrôle).

| Phase | Contenu | Pourquoi cet ordre |
|---|---|---|
| **0** | Squelette (ce commit) : modèle de données, moteur, worker, UI minimale | Fondation partagée par tout le reste |
| **0bis** | Auth multi-agence réelle, upload photos vers R2 | Bloquant pour un usage réel, mais indépendant du reste — à faire dès que le pipeline vidéo est validé une fois en bout en bout avec des URLs codées en dur |
| **1** | Génération vidéo + descriptif (le cœur de la proposition de valeur) | Différenciant principal, le plus dur techniquement (Kling, storyboard, montage) — le valider tôt réduit le risque produit |
| **2** | Staging virtuel + retouche photo ("Photos qui vendent") | Techniquement déjà dérisqué (modèle Replicate testé par le fondateur), réutilise le même pipeline `Job`/worker que la phase 1 — coût marginal faible pour une vraie valeur de vente |
| **3** | Site épuré par bien | Consomme les sorties des phases 1-2 (vidéo, descriptif, photos) — n'a de sens qu'une fois celles-ci fiables |
| **4** | Publication réseaux sociaux (OAuth Facebook/Instagram/TikTok, validation manuelle) | Le plus gros coût d'intégration/conformité (review d'app Meta, accès développeur TikTok) et le moins différenciant seul — dépend aussi d'avoir du contenu (vidéo) à publier |
| **5** | Visite/photo 360° | Niche (uniquement les clients avec caméra dédiée) — traité en dernier, feature à part qui ne bloque rien d'autre |
| *(transverse)* | Pitch de vente pour démarcher agences/notaires | Pas du code — asset commercial, à produire dès que la démo vidéo (fin phase 1) est présentable |

La phase 0bis (auth + upload réel) est délibérément détachée de la phase 0 :
le plus rapide pour valider le pipeline IA de bout en bout est de tester
avec des URLs de photos déjà hébergées (ce que le squelette permet déjà),
plutôt que de bloquer sur l'upload avant d'avoir prouvé que Kling produit
des vidéos vendables.

## 4bis. Pricing (`packages/pricing`)

Abonnement mensuel + quota de crédits (1 crédit ≈ 1 €), plutôt que le
paiement à l'unité du Produit 1 : plus adapté à un usage récurrent multi-biens
par une agence, et laisse la porte ouverte à des recharges ponctuelles.

```
POST /api/properties/:id/jobs
        │
        ▼
 transaction Postgres :
   - lit Agency.creditBalance
   - si < coût du job (packages/pricing.CREDIT_COST[type]) → 402, rien n'est créé
   - sinon : crée le Job, décrémente creditBalance, log CreditTransaction(CONSUMPTION)
        │
        ▼
 worker traite le job
        │
   ┌────┴────┐
   ▼         ▼
 DONE      FAILED → recrédite creditBalance, log CreditTransaction(REFUND)
```

Débit et création du job sont dans la **même transaction** : impossible de
lancer un traitement payant sans le facturer, ni de facturer sans lancer le
traitement. `CREDIT_COST` et `PLANS` vivent dans `packages/pricing`, pas dans
le schéma : ce sont des constantes business qui changent rarement et n'ont
pas besoin d'être éditables en base pour le MVP — les faire évoluer, c'est
éditer un fichier et redéployer.

`PHOTO_ANALYSIS` coûte 0 crédit : c'est une étape interne dont le résultat
sert à la fois la vidéo et le descriptif, qui eux sont facturés — la facturer
aussi aurait été une double charge pour la même information.

Pas encore fait : le paiement réel (Stripe) pour l'achat d'abonnement/recharge
— voir README, section "Pricing".

## 4. Décisions prises vs. ouvertes

**Prises** (documentées ici pour traçabilité, changeables) :
- Stack full TypeScript (Next.js + Node), pas de service Python séparé.
- Postgres + Prisma, un seul schéma partagé entre `web` et `worker`.
- File de jobs = table Postgres pollée, pas de Redis pour le MVP.
- Stockage prévu : Cloudflare R2 (S3-compatible).
- Nom de marque : **RealtyStudio**.
- Modèle de pricing : abonnement + crédits (voir §4bis) — les montants
  eux-mêmes (`packages/pricing`) restent une proposition initiale à ajuster
  sur les coûts réels observés.

**Encore ouvertes** (à trancher ensemble) :
- Montants exacts des plans et du coût par action (voir §4bis) — cohérents
  avec le pricing à l'unité du Produit 1 (49€/vidéo) mais pas encore
  confrontés aux coûts API réels.
- Intégration du paiement (Stripe) pour l'achat d'abonnement/recharge.
- Modèle Replicate précis pour la retouche photo (`REPLICATE_PHOTO_ENHANCE_MODEL`
  vide dans `.env.example` — à choisir après tests, comme le staging l'a été).
- Version exacte du modèle Kling et paramètres de montage (durée totale de
  vidéo cible, musique, sous-titres auto ou non).
