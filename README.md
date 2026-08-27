# RealtyStudio — Produit 2

SaaS pour agences immobilières et notaires : transforme les photos d'un bien
en vidéo courte, descriptif automatique et fiche prête à publier — au compte
de l'agence, jamais celui du propriétaire.

Ce repo ne construit que le **Produit 2**. Le Produit 1 (Reelty, grand
public Airbnb/spas/campings) viendra plus tard et réutilisera le moteur IA
(`packages/engine`) construit ici — voir la note "Réutilisabilité" plus bas.

## Architecture en un coup d'œil

Monorepo pnpm, full TypeScript :

```
apps/
  web/      Next.js 14 (App Router) — dashboard agence, fiches bien, API routes
  worker/   Process Node qui dépile les jobs IA et appelle le moteur
packages/
  db/       Schéma Prisma + client (Postgres)
  engine/   Moteur IA : analyse photos, storyboard, génération vidéo,
            staging virtuel, retouche photo, descriptif
  pricing/  Plans & coût en crédits par type de job (voir "Pricing" plus bas)
```

**Pourquoi séparer `engine` du reste :** c'est la seule partie du code que le
Produit 1 réutilisera. Elle ne connaît ni "agence" ni "bien immobilier" —
seulement des photos en entrée et des vidéos/descriptifs/images en sortie.
Le jour où Reelty démarre, ce package s'exporte tel quel dans son propre
repo (ou devient un package npm privé partagé) sans réécriture.

**Pourquoi un worker séparé du web :** la génération vidéo (Kling via
Replicate) prend potentiellement plusieurs minutes — bien au-delà d'un
timeout de fonction serverless. Le flux est donc asynchrone :

```
UI (Next.js) --POST--> Job (Postgres, status=PENDING)
                              |
                    apps/worker (poll toutes les 5s)
                              |
                    packages/engine (Claude / Replicate)
                              |
                    écrit le résultat (Video / GeneratedDescription / Photo)
                              |
UI (Next.js) --GET /api/jobs/:id (poll)--> affiche le résultat
```

Pas de Redis/BullMQ pour le MVP — une table `Job` Postgres pollée suffit au
volume attendu au démarrage. À remplacer par une vraie file si le débit
devient un goulot d'étranglement (le code du worker est écrit pour que ce
soit un changement localisé, pas une réécriture).

**Infra visée** (pas encore provisionnée dans ce repo) : Vercel pour
`apps/web`, Railway ou Fly.io pour `apps/worker` + Postgres, Cloudflare R2
pour le stockage des photos/vidéos. Choisi pour son coût et sa simplicité en
solo-bootstrap ; facilement remplaçable.

Voir `docs/ARCHITECTURE.md` pour le détail (modèle de données, pipeline IA
complet, ordre de build justifié, décisions ouvertes).

## Pricing

Abonnement mensuel avec un quota de crédits (1 crédit ≈ 1 €), débités par
job IA lancé et remboursés automatiquement si le job échoue. Toute la config
(plans, coût en crédits par type de job) est centralisée dans
`packages/pricing` — voir la page `/pricing` de l'app pour la table actuelle.
C'est une **proposition initiale**, à ajuster une fois les coûts Claude/Replicate
réels observés en usage.

Mécanique :
- `Agency.creditBalance` — solde courant (une nouvelle agence démarre avec un
  petit crédit d'essai, voir `schema.prisma`).
- `CreditTransaction` — ledger complet (achat, consommation, remboursement,
  bonus), pour l'audit et un futur relevé de conso par agence.
- Débit et création du job sont atomiques (`app/api/properties/[id]/jobs/route.ts`) ;
  la route renvoie `402` si le solde est insuffisant.
- Le worker recrédite automatiquement en cas d'échec (`apps/worker/src/index.ts`).

Pas encore fait : le paiement lui-même (Stripe pour l'abonnement + les
recharges à l'unité) — le squelette gère le solde de crédits, pas encore
l'achat.

## État actuel — ce qui marche vs ce qui reste à faire

Fait dans ce squelette :
- Modèle de données multi-agence complet (`packages/db/prisma/schema.prisma`)
- Moteur IA avec vraie logique d'appel Claude (analyse photos + storyboard,
  génération de descriptif) et Replicate (vidéo, staging, retouche)
- Worker fonctionnel (poll → dispatch → écrit le résultat en base)
- Dashboard + fiche bien + déclenchement du pipeline depuis l'UI
- Système de crédits complet (débit atomique, remboursement auto, ledger,
  page `/pricing`) — voir section "Pricing" ci-dessus

Volontairement pas fait (TODO explicites dans le code, cf. commentaires) :
- **Auth réelle** (`lib/currentAgency.ts` renvoie la première agence en base)
- **Upload de photos** (les photos s'ajoutent par URL pour l'instant, pas
  d'upload binaire vers R2 — `app/api/properties/[id]/photos/route.ts`)
- **Montage vidéo** (`apps/worker/src/ffmpeg.ts` renvoie le premier clip tel
  quel — la concaténation/transitions ffmpeg reste à écrire)
- Staging virtuel, retouche photo, site par bien, publication réseaux
  sociaux, visite 360° : modélisés en base et dans le moteur mais pas encore
  câblés dans l'UI (voir roadmap)
- **Paiement** (Stripe) : le solde de crédits existe et se débite/rembourse
  correctement, mais rien ne permet encore à une agence d'acheter un
  abonnement ou une recharge

## Setup

```bash
pnpm install
cp .env.example .env   # puis renseigner DATABASE_URL, ANTHROPIC_API_KEY, REPLICATE_API_TOKEN...
pnpm db:migrate         # crée les tables
pnpm db:generate

pnpm dev:web             # http://localhost:3000
pnpm dev:worker          # dans un autre terminal
```

Il n'y a pas encore de script de seed — pour tester, créez une `Agency` à la
main via `pnpm --filter @realtystudio/db studio` (Prisma Studio) avant
d'utiliser le dashboard.
