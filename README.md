# Festival Backend Core

Backend d'une plateforme de gestion de festival (expositions, lieux, créneaux,
réservations), structuré selon la Clean Architecture, en TypeScript.

Blocs évalués : **Authentification avancée** et **Clean Architecture**.

## Démarrage rapide

Prérequis : Node.js >= 20, Docker (pour PostgreSQL).

```
cp .env.example .env
npm install               # installe les dépendances et génère le client Prisma (postinstall)
npm run typecheck         # vérifie les types (0 erreur attendue)
npm test                  # lance les tests (74 sans base ; 2 tests Prisma ignorés)
npm run arch:check        # vérifie l'absence d'import interdit dans le coeur

# Base de données (requise pour lancer l'API)
docker compose up -d db   # démarre PostgreSQL
npm run db:push           # crée le schéma dans la base (Prisma)
npm run db:seed           # insère des données de démonstration (comptes de test)
npm run dev               # démarre l'API sur http://localhost:3000
```

Le fichier `.env` (copié depuis `.env.example`) doit exister avant les commandes
Prisma et le serveur : `DATABASE_URL` y est défini. `npm install` seul ne suffit
donc pas pour lancer l'API.

Les tests s'exécutent sans base de données : ils utilisent des repositories en
mémoire. Le serveur (`npm run dev`) utilise PostgreSQL via Prisma ; il faut donc
démarrer la base et pousser le schéma au préalable.

## Comptes de test

Créés par `npm run db:seed`.

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| ADMIN | admin@festival.fr | Admin123! |
| ORGANIZER | organizer@festival.fr | Organizer123! |
| STAFF | staff@festival.fr | Staff123! |
| VISITOR | visitor@festival.fr | Visitor123! |

Le seed insère aussi 1 lieu (Maison Européenne de la Photographie), 1 événement,
2 créneaux (un ouvert à tous, un réservé aux rôles ORGANIZER/ADMIN) et 1
réservation d'exemple (le visiteur, sur le créneau ouvert, statut PENDING).

### Scénario rapide (API démarrée sur le port 3000)

```
# 1. Le visiteur se connecte et consulte ses réservations (voit celle du seed)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"visitor@festival.fr","password":"Visitor123!"}'
curl http://localhost:3000/api/reservations/me \
  -H "Authorization: Bearer <accessToken visitor>"

# 2. Le staff valide la réservation d'exemple (PENDING -> CONFIRMED)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@festival.fr","password":"Staff123!"}'
curl -X POST http://localhost:3000/api/reservations/seed-reservation-1/validate \
  -H "Authorization: Bearer <accessToken staff>"

# 3. L'admin accède à une route protégée par rôle
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@festival.fr","password":"Admin123!"}'
curl http://localhost:3000/api/admin/ping \
  -H "Authorization: Bearer <accessToken admin>"
```

Pour tester la création d'une réservation, réservez le créneau ouvert
(`seed-slot-open`) avec un visiteur qui ne l'a pas encore : `POST
/api/reservations` avec `{ "slotId": "seed-slot-open" }`.

### Scénario organisateur (création du catalogue)

```
# 1. L'organisateur se connecte
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"organizer@festival.fr","password":"Organizer123!"}'

# 2. Crée un lieu (renvoie l'id du lieu)
curl -X POST http://localhost:3000/api/venues \
  -H "Authorization: Bearer <accessToken organizer>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Galerie Nord","address":"Paris","capacity":150}'

# 3. Crée un événement rattaché au lieu (renvoie l'id de l'événement)
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer <accessToken organizer>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Nouvelle Expo","description":"...","venueId":"<venueId>","startDate":"2030-06-01T00:00:00.000Z","endDate":"2030-06-30T00:00:00.000Z"}'

# 4. Ajoute un créneau à son événement
curl -X POST http://localhost:3000/api/events/<eventId>/slots \
  -H "Authorization: Bearer <accessToken organizer>" \
  -H "Content-Type: application/json" \
  -d '{"startTime":"2030-06-10T10:00:00.000Z","endTime":"2030-06-10T12:00:00.000Z","capacity":30}'
```

## Bloc Clean Architecture

Le code est organisé en couches, avec une règle de dépendance orientée vers
l'intérieur : `interface` et `infrastructure` dépendent de `application`, qui
dépend de `domain`.

| Couche | Contenu |
| --- | --- |
| `domain` | Entités, value objects, erreurs métier, policies, interfaces de repositories. Aucune dépendance à un framework. |
| `application` | Cas d'usage et ports techniques (Clock, IdGenerator, PasswordHasher, TokenService, RefreshTokenService). |
| `infrastructure` | Adapters : repositories Prisma et en mémoire, mappers, SystemClock, UuidGenerator, bcrypt, JWT, crypto. |
| `interface` | Application Express : routes, middlewares, gestionnaire d'erreurs, présentateurs. |
| `main` | Composition root (assemblage des dépendances) et point d'entrée du serveur. |

Le domaine et l'application n'importent ni Express, ni Prisma, ni JWT, ni bcrypt.
Cette contrainte est vérifiée automatiquement :

```
npm run arch:check
```

La commande détecte tout `import ... from`, `require(...)` ou `import("...")` des
modules d'infrastructure (express, prisma, jsonwebtoken, bcrypt, argon2, jose)
dans `domain/` et `application/`.

Preuve d'indépendance : les cas d'usage sont testés sans base de données ni
serveur HTTP, grâce à des implémentations en mémoire des repositories.

## Persistance (Prisma)

Prisma vit **exclusivement dans la couche infrastructure**. Le schéma
(`prisma/schema.prisma`), le client, les mappers et les repositories Prisma
n'existent que là. Le domaine et l'application ne connaissent que les interfaces
de repositories ; `npm run arch:check` interdit tout import de Prisma dans le
coeur. Le composition root choisit l'implémentation : en mémoire pour les tests
et le développement sans base, Prisma/PostgreSQL pour le serveur.

Les modèles Prisma ne remplacent pas les entités du domaine : des mappers
convertissent modèle de persistance ↔ entité (`toDomainUser` / `toPersistenceUser`,
etc.).

Commandes Prisma :

```
npm run prisma:generate   # génère le client (aussi lancé au postinstall)
npm run db:push           # synchronise le schéma avec la base (développement)
npm run db:migrate        # crée/applique une migration versionnée
```

### Contraintes de base qui renforcent les règles métier

- `User.email` `@unique` : une violation (code Prisma `P2002`) est traduite en
  `EmailAlreadyInUseError` par `PrismaUserRepository`, en plus du pré-contrôle
  dans `RegisterUser`. Couvre le cas de deux inscriptions concurrentes.
- `RefreshToken.tokenHash` `@unique` et consommation atomique de l'ancien refresh
  token : `consume` révoque le token par une mise à jour conditionnelle
  (`revokedAt IS NULL AND expiresAt > now`) en une seule requête. Si aucune ligne
  n'est affectée, le rejeu est refusé (`InvalidRefreshTokenError`). La création du
  nouveau refresh token est une opération distincte, hors de cette transaction.
- `Reservation @@unique([userId, slotId])` : le doublon est bloqué en base
  (`P2002` traduit en `DuplicateReservationError`), en plus de la règle métier.
- Capacité protégée contre la concurrence : l'insertion d'une réservation se fait
  dans une transaction qui verrouille la ligne du créneau (`SELECT ... FOR UPDATE`)
  avant de recompter les places, ce qui empêche le dépassement de capacité en
  accès concurrent. La règle reste lisible dans le use case ; la protection contre
  les courses vit dans `PrismaReservationRepository`.

Un test d'intégration Prisma (`tests/integration/PrismaAuth.test.ts`) valide ces
comportements sur une vraie base. Il est ignoré par défaut et s'active ainsi :

```
docker compose up -d db
npm run db:push
RUN_PRISMA_IT=1 npm test
```

Avertissement : ce test nettoie les tables concernées (`deleteMany` avant chaque
cas). Lancez `RUN_PRISMA_IT=1` sur une **base de test dédiée**, jamais sur une
base contenant des données à conserver (le seed serait effacé).

## Bloc Authentification avancée

### Flux

1. `POST /api/auth/register` : inscription. Le mot de passe est haché (bcrypt) ;
   l'utilisateur reçoit le rôle `VISITOR`.
2. `POST /api/auth/login` : émet un **access token** (JWT, courte durée) et un
   **refresh token** (aléatoire, longue durée).
3. `POST /api/auth/refresh` : **rotation**. Le refresh token présenté est révoqué
   et un nouveau couple est émis. Un token révoqué ou expiré est refusé (401).
4. `POST /api/auth/logout` : révoque le refresh token présenté.
5. `GET /api/auth/me` : profil de l'utilisateur authentifié (route protégée).

### Sécurité

- Mots de passe hachés avec bcrypt ; jamais stockés ni renvoyés en clair.
- Access token JWT signé, vérifié par le middleware `authenticate`.
- Refresh token aléatoire (256 bits) **stocké haché** (SHA-256) : la valeur en
  clair n'est jamais persistée. La recherche se fait par hash.
- Rotation des refresh tokens : réutiliser un ancien token échoue.
- Routes sensibles protégées par `authenticate` (401 si token absent/invalide)
  et `authorize` (403 si rôle insuffisant).

### Rôles et permissions

Les droits sont définis par action, sans hiérarchie de rôles : un rôle n'obtient
que les droits explicitement listés.

| Action | VISITOR | STAFF | ORGANIZER | ADMIN |
| --- | :---: | :---: | :---: | :---: |
| RESERVE | oui | oui | oui | oui |
| VALIDATE_RESERVATION | non | oui | oui | oui |
| CREATE_EVENT | non | non | oui | oui |
| MANAGE_USERS | non | non | non | oui |

## Routes exposées

| Méthode | Chemin | Accès |
| --- | --- | --- |
| GET | /health | public |
| POST | /api/auth/register | public |
| POST | /api/auth/login | public |
| POST | /api/auth/refresh | public (refresh token requis) |
| POST | /api/auth/logout | public (refresh token requis) |
| GET | /api/auth/me | authentifié |
| GET | /api/admin/ping | authentifié + action MANAGE_USERS (rôle ADMIN) |
| POST | /api/reservations | authentifié (body `{ slotId }`) |
| GET | /api/reservations/me | authentifié |
| DELETE | /api/reservations/:id | authentifié (propriétaire ou ADMIN ; annulation) |
| POST | /api/reservations/:id/validate | authentifié + action VALIDATE_RESERVATION (STAFF/ORGANIZER/ADMIN) |
| POST | /api/venues | authentifié + action CREATE_EVENT (ORGANIZER/ADMIN) |
| GET | /api/events | public |
| POST | /api/events | authentifié + action CREATE_EVENT (ORGANIZER/ADMIN) |
| GET | /api/events/:id/slots | public |
| POST | /api/events/:id/slots | ORGANIZER propriétaire de l'événement ou ADMIN |

### Exemples

```
# Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"visiteur@festival.fr","password":"Visiteur123!"}'

# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"visiteur@festival.fr","password":"Visiteur123!"}'

# Profil (remplacer <accessToken>)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

## Règles métier de réservation

Le cas d'usage `CreateReservation` applique, dans l'ordre : créneau existant,
créneau non passé, action autorisée par rôle, accès au créneau (liste blanche de
rôles), absence de doublon, place disponible, quota global de réservations
actives par utilisateur, absence de conflit horaire. Chaque règle possède une
erreur métier dédiée et un test.

`CancelReservation` est réservée au propriétaire ou à un ADMIN et passe le statut
à CANCELLED (annulation métier, pas de suppression). `ValidateReservation` est
réservée aux rôles STAFF/ORGANIZER/ADMIN (action VALIDATE_RESERVATION) et fait
passer une réservation en attente à CONFIRMED. L'autorisation dépendante du
propriétaire est portée par le use case ; l'autorisation par rôle passe par le
middleware `authorize`.

## Tests

- Tests unitaires : cas d'usage de réservation (CreateReservation, CancelReservation,
  ValidateReservation) et d'authentification (RegisterUser, LoginUser, RefreshTokens,
  LogoutUser, GetProfile), mappers Prisma (User, RefreshToken) et repositories Prisma
  (traduction P2002 -> EmailAlreadyInUseError, `consume` -> null quand le token est
  déjà consommé), avec des doublures rapides, sans base de données.
  Ajoute les cas d'usage du catalogue (CreateVenue, CreateEvent, CreateSlot :
  succès, entités introuvables, dates invalides, ownership organisateur).
- Tests d'intégration (Supertest) : /health, flux d'authentification complet,
  autorisation par rôle (401 sans token, 403 mauvais rôle, 200 bon rôle), routes
  de réservation (POST 401/201, DELETE 403 pour un tiers, annulation par le
  propriétaire, validate 403 VISITOR / 200 STAFF), et routes du catalogue (venues
  401/403/201, events 201, slots 403 pour un autre organisateur / 201 pour un
  ADMIN, GET events et slots publics 200).
- Test d'intégration Prisma sur base réelle : ignoré par défaut, activé avec
  `RUN_PRISMA_IT=1` (voir section Persistance).
- Total : 74 tests exécutés (plus 2 tests Prisma ignorés sans base).

## Limites connues

- L'annulation d'une réservation est métier (statut CANCELLED, pas de suppression
  physique). La protection de capacité et le contrôle des doublons sont assurés
  côté persistance (`PrismaReservationRepository`).
- Repositories en mémoire volatils : utilisés pour les tests et le développement
  sans base ; les données n'y survivent pas à un redémarrage. Le serveur utilise
  PostgreSQL via Prisma.
- Migrations : `db:push` synchronise le schéma pour le développement. Aucune
  migration versionnée n'est committée pour l'instant (`db:migrate` à utiliser
  pour en générer).
- Un seul secret d'access token ; la détection de rejeu se limite au refus d'un
  refresh token déjà consommé (pas d'invalidation en cascade de la famille de
  tokens en cas de vol détecté).

## Structure du projet

```
prisma/
  schema.prisma    modèles de persistance (User, RefreshToken, Venue, Event, Slot, Reservation)
src/
  domain/          entités, value objects, erreurs, policies, interfaces de repositories
  application/     cas d'usage et ports techniques
  infrastructure/  adapters : persistance (prisma/, in-memory/), sécurité, temps, id, config
  interface/http/  routes, middlewares, gestionnaire d'erreurs, présentateurs
  main/            composition root (in-memory et Prisma) et serveur
tests/
  unit/            tests des cas d'usage et des mappers/repositories Prisma
  integration/     tests HTTP (Supertest), dont un test Prisma conditionnel
  fakes/ support/  doublures et utilitaires de test
scripts/
  check-architecture.sh
```
