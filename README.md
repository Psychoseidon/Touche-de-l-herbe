# Viens toucher de l'herbe

Application de rencontres IRL équitable & sans biais — rencontres réelles basées
sur des événements de groupe et une découverte par swipe, sans ELO ni premium.
Cahier des charges initial (sous le nom de travail "MEETUP") complet dans
[`docs/MEETUP_spec_claude_code.docx`](docs/MEETUP_spec_claude_code.docx).

## Stack

Next.js 16 (App Router) + TypeScript, Prisma + PostgreSQL (Neon), Tailwind +
shadcn/ui (Base UI primitives), NextAuth.js v5 (Credentials), Pusher (chat
temps réel, fallback polling), Stripe (dons), Vercel Blob (upload de photos).

Déployé sur Vercel (projet `tbird68/rencontre`), auto-déploiement à chaque
push sur `main` via l'intégration GitHub.

## Démarrer

```bash
npm install
npx prisma migrate dev
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Copie `.env.example` vers `.env`. Tout sauf `DATABASE_URL` et `AUTH_SECRET` est
optionnel — les fonctionnalités concernées se dégradent proprement si la clé
n'est pas configurée :

- **Pusher** (`PUSHER_*`) absent → le chat (DM et groupe) passe en polling
  toutes les 4s au lieu du temps réel.
- **Stripe** (`STRIPE_*`) absent → `/donate` renvoie une erreur explicite au
  lieu d'ouvrir un checkout.
- **Stripe** absent → la vérification carte anti-fraude (`/auth/verify-card`)
  est sautée et le compte est marqué vérifié directement (voir ci-dessous).

`BLOB_READ_WRITE_TOKEN` (Vercel Blob) n'est volontairement pas dans cette
liste "dégrade proprement" : c'est requis dès l'inscription (photo de profil
obligatoire). Provisionné via `vercel blob create-store <name> --access
public --yes`, qui remplit la variable automatiquement.

## Anti-multicompte / anti-mineur (gratuit, sans vérif ID)

Pas de Yoti/Veriff en V1 (payant, hors MVP — cf. 10.2). À la place :

- **Téléphone unique en base** : un même numéro ne peut pas créer 2 comptes
  (contrainte `@unique` sur `User.phone`, vérifiée aussi côté API pour un
  message d'erreur clair).
- **Empreinte de carte bancaire** (`/auth/verify-card`, si `STRIPE_SECRET_KEY`
  est configuré) : un `SetupIntent` Stripe valide la carte sans débiter un
  centime, et son `fingerprint` (empreinte de la carte physique) est stocké
  sur `User.cardFingerprint` avec contrainte unique — la même carte ne peut
  pas vérifier 2 comptes. C'est aussi un frein imparfait mais réel contre les
  mineurs (peu en ont une en propre). Le badge "Profil vérifié" n'est posé
  qu'une fois cette étape passée.

Ce sont des freins, pas des garanties absolues (contournables avec plusieurs
cartes/numéros) — une vérification d'identité fiable nécessiterait un
prestataire payant (Yoti, Veriff).

## Passer un compte en admin (accès `/moderation`)

Aucune UI pour ça en V1 (cf. périmètre MVP). Depuis Prisma Studio ou un script :

```bash
npx prisma studio
# ou
node -e "require('@prisma/client'); /* ... */"
```

Mets `isAdmin = true` sur l'utilisateur souhaité dans la table `User`.

## Recalcul de la Fair Queue

`GET /api/cron/visibility-score` recalcule le `visibilityScore` de tous les
utilisateurs (formule en section 3.2 du cahier des charges). Appelé
quotidiennement par le cron Vercel défini dans `vercel.json`. Protège l'accès
avec un header `Authorization: Bearer $CRON_SECRET` si `CRON_SECRET` est défini.

## Swipe découverte (`/discover`) + protection 18-25

En plus du double opt-in post-rencontre, `/discover` permet de swiper des
profils inconnus (vérifiés, non suspendus), classés par Fair Queue (pas de
popularité achetée). Un match mutuel (`Swipe` avec `direction: LIKE` dans les
deux sens) débloque le chat **et** suggère de se retrouver à une vraie sortie
— pas de chat-only à l'infini. Pas d'ELO caché, pas de premium : juste le
geste de swipe.

Protection 18-25 (`src/lib/age.ts`, `canInteract`) : les 18-19 ans ne peuvent
interagir en 1:1 (intérêt, swipe, messages) qu'avec d'autres 18-25 ans ; les
20-25 ans interagissent avec tout le monde ; les 26+ ne peuvent pas interagir
avec les 18-19 ans. Ne s'applique qu'aux interactions 1:1, pas à la visibilité
des événements de groupe.

Le swipe n'a de sens que si les profils sont renseignés : `/discover` exige
que l'utilisateur ait complété sa présentation (`/profile/complete` — bio,
1 à 4 photos, centres d'intérêt, ce qu'il recherche) et ne montre que des
candidats l'ayant fait aussi (`User.profileCompletedAt`).

## Upload de photos (drag-and-drop)

`src/components/photo-dropzone.tsx` : glisser-déposer une image ou cliquer
pour parcourir, upload direct vers Vercel Blob (`@vercel/blob`), pas d'URL à
copier-coller. Deux routes :

- `POST /api/upload` (authentifiée) : galerie de présentation, profil.
- `POST /api/upload/signup` (non authentifiée) : photo de profil à
  l'inscription, avant qu'un compte n'existe donc avant toute session —
  mêmes garde-fous (image uniquement, 8 Mo max).

Web uniquement pour l'instant (le drag-and-drop n'a pas d'équivalent mobile
naturel) ; l'app mobile garde un champ URL pour la photo.

## Le blog du profil

Au-delà de la bio courte (utilisée pour la présentation/swipe), chaque membre
a un espace d'expression libre sur son profil (`ProfilePost`) : plusieurs
billets datés, titre optionnel, contenu en markdown (titres, gras, liens,
listes — rendu via `react-markdown`, sans HTML brut). Visible par tous,
modifiable seulement par son auteur (`/api/profile/posts`,
`/api/profile/posts/[id]`). C'est la vraie page personnelle, pas la bio
contrainte à 280 caractères.

## Sorties autour de chez toi (rayon configurable) + idées externes

La page d'accueil géocode l'adresse de chaque événement à la création
(`src/lib/geo.ts`, Nominatim/OpenStreetMap, gratuit et sans clé) puis filtre
côté client par distance (Haversine, `withDistance`) une fois la position du
visiteur autorisée, avec un slider de rayon (5 à 200 km) **partagé** entre les
deux sections de la page (`src/components/local-events.tsx`). **Les deux
sections sont masquées tant que le visiteur n'a pas autorisé sa position** :
sans ça, avec des suggestions désormais nationales, on afficherait un mélange
d'événements à travers toute la France sans aucun filtre pertinent.

- **Sorties autour de chez toi** : événements créés par des membres.
- **Idées de sorties autour de toi** : événements publics suggérés depuis deux
  sources, jamais du scraping de sites tiers (CGU + droit des bases de
  données + fragilité technique à chaque refonte) :
  - **Open Data Paris** (`src/lib/paris-opendata.ts`) : jeu de données officiel
    de la Ville de Paris (`que-faire-a-paris-`), soit le contenu réel de
    [quefaire.paris.fr](https://quefaire.paris.fr) (concerts, expos, ateliers,
    festivals...) — ~2700 événements à venir, **aucune clé requise**, source
    publique structurée. Couvre uniquement Paris.
  - [OpenAgenda](https://openagenda.com) (`src/lib/openagenda.ts`) : agrégateur
    français complémentaire, optionnel (désactivé si `OPENAGENDA_*` absents).
    Interroge **plusieurs agendas en parallèle** (`OPENAGENDA_AGENDAS`, liste
    séparée par des virgules), un par métropole/lieu, pour couvrir le reste de
    la France : Marseille (+ ses musées), Nantes, Bordeaux, Lille, Toulouse,
    Rennes, Rouen, Dijon, Orléans, Le Mans, Strasbourg, Angers, Montpellier...
    Trouvé en interrogeant directement l'API de recherche d'agendas
    d'OpenAgenda et en vérifiant le nombre d'événements à venir de chaque
    candidat — pas tiré d'une liste officielle. Certaines grandes villes
    (Lyon, Nice, Toulon, Grenoble, Clermont-Ferrand, Nîmes, Brest, Tours,
    Caen, Nancy, Saint-Étienne, Le Havre, Perpignan...) n'ont, à ce jour, pas
    d'agenda OpenAgenda actif et suffisamment fourni — elles n'affichent que
    les sorties créées par les membres. Pour les couvrir comme Paris, il
    faudrait un adaptateur dédié par ville (si elle publie son propre portail
    open data), à ajouter au cas par cas.
  - `GET /api/cron/sync-events` (cron quotidien, `vercel.json`) récupère les
    deux sources en parallèle et les upsert dans `SuggestedEvent`
    (`src/lib/sync-suggested-events.ts`), en retirant celles qui sont passées.
  - Chaque suggestion affiche ses catégories (`tags`, ex. "Concert", "Expo",
    "Théâtre") en badges, juste à titre informatif — pas de filtrage par
    centre d'intérêt : les centres d'intérêt du profil servent uniquement à
    se présenter aux autres membres (présentation, swipe), pas à personnaliser
    les suggestions, pour rester simple.

Best-effort partout : si une adresse n'est pas géolocalisable, l'événement
reste créé/affiché, juste sans filtre de distance.
- Une suggestion reste un événement externe, jamais un `Event` du site : un
  membre clique "Organiser ça avec mon groupe" pour préremplir le formulaire
  de création (`/events/new?suggestionId=...`) et en faire une vraie sortie.
- Clé publique gratuite : https://openagenda.com/settings/apiKey

## Périmètre MVP (V1)

Implémenté : auth + profil vérifié (simplifié, sans liveness/Yoti — cf. 10.2),
création/listing d'événements avec Fair Queue, swipe découverte + double
opt-in post-rencontre, chat post-match, groupe persistant + chat de groupe,
signalement + queue de modération, don Stripe + page `/finances`.

Hors MVP (V2+, cf. section 10.2 du cahier des charges) : vérification d'âge
légale complète (Yoti/Veriff), suggestions automatiques de re-sorties, badges
de réputation avancés, notifications push, filtres avancés.

## App mobile

Un projet Expo/React Native séparé vit dans [`mobile/`](mobile/README.md) et
réutilise les mêmes routes API que le site (auth par Bearer token plutôt que
cookie — voir `src/lib/session.ts` et `src/lib/mobile-auth.ts`). Couvre les 8
features sauf la file de modération admin (web uniquement, usage trop niche
pour mobile).
