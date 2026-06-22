# Touche de l'herbe — app mobile (Expo / React Native)

App native Android/iOS. Réutilise les mêmes routes API que le site web
(`../src/app/api`) — pas de backend séparé.

Périmètre actuel : inscription/connexion, événements (liste/détail/création/
jointure), Fair Queue (ordre transparent, pas d'écran dédié), swipe découverte
(`Découvrir`, geste réel via react-native-gesture-handler + reanimated) et
signal d'intérêt double opt-in, chat post-match et de groupe (polling, pas de
temps réel Pusher ici encore), groupes persistants, signalement de profil, don
(ouvre le Checkout Stripe dans le navigateur intégré).

Présentation de profil obligatoire avant le swipe (bio, photos, centres
d'intérêt, ce qu'on recherche — écran `profile-complete`) et blog personnel
(billets datés en texte libre, écran `profile-blog`, accessibles depuis
l'onglet Profil) — gestion de ses propres billets seulement.

Pas encore porté sur mobile : la file de modération admin (`/moderation`) —
niche, réservée aux admins, le web suffit pour ça pour l'instant. Idem pour la
consultation du profil/blog d'un autre membre (web uniquement, `/profile/[id]`,
pour l'instant).

## Démarrer

```bash
cd mobile
npm install
```

Renseigne `EXPO_PUBLIC_API_URL` dans `.env` avec l'IP locale de la machine qui
fait tourner `npm run dev` à la racine du repo (visible dans la sortie
`Network: http://<ip>:3000` de `next dev`) — le téléphone doit être sur le
même Wi-Fi.

```bash
npx expo start
```

Scanne le QR code avec l'app **Expo Go** (Android/iOS) pour tester en
conditions réelles sur un téléphone.

## Authentification

Le site web utilise des cookies de session (NextAuth) ; React Native ne peut
pas en dépendre facilement, donc l'app mobile utilise un jeton JWT séparé :

- `POST /api/mobile/login` → renvoie `{ token, user }` (signé avec `AUTH_SECRET`,
  valable 90 jours).
- `GET /api/mobile/me` → infos du compte connecté via `Authorization: Bearer <token>`.
- Le token est stocké chiffré avec `expo-secure-store` (`SecureStore`).

Toutes les routes API qui acceptent l'auth web (`auth()`/cookie) acceptent
désormais aussi ce Bearer token, via `src/lib/session.ts` (`getRequestUserId`)
côté Next.js — voir ce fichier avant d'ajouter un nouvel écran mobile qui a
besoin d'une route protégée non encore migrée (ex. groupes, modération, dons).

## Avant de publier sur les stores

Du code, j'en fais autant que tu veux — mais la soumission finale nécessite
des comptes que je ne peux pas créer à ta place :

- **Apple Developer Program** : 99 $/an, requis pour soumettre sur l'App Store.
- **Google Play Console** : 25 $ (paiement unique), requis pour le Play Store.

D'ici là, `npx expo start` + Expo Go suffit pour développer et tester.
