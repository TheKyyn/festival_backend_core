# Festival Backend Core

Backend d'une plateforme de gestion de festival (expositions, lieux, créneaux,
réservations), structuré selon la Clean Architecture, en TypeScript.

Blocs évalués : **Authentification avancée** et **Clean Architecture**.

## Démarrage rapide

Prérequis : Node.js >= 20. Docker (optionnel, pour PostgreSQL).

```
cp .env.example .env
npm install
npm run typecheck   # vérifie les types (0 erreur attendue)
npm test            # lance les tests (32 attendus)
npm run arch:check  # vérifie l'absence d'import interdit dans le coeur
npm run dev         # démarre l'API sur http://localhost:3000
```

Un service PostgreSQL est fourni via `docker compose up -d`. Il est préparé pour
l'étape suivante mais n'est pas encore utilisé : tant que Prisma n'est pas
branché, les repositories fonctionnent en mémoire et les données ne sont pas
persistées entre deux redémarrages.

## Bloc Clean Architecture

Le code est organisé en couches, avec une règle de dépendance orientée vers
l'intérieur : `interface` et `infrastructure` dépendent de `application`, qui
dépend de `domain`.

| Couche | Contenu |
| --- | --- |
| `domain` | Entités, value objects, erreurs métier, policies, interfaces de repositories. Aucune dépendance à un framework. |
| `application` | Cas d'usage et ports techniques (Clock, IdGenerator, PasswordHasher, TokenService, RefreshTokenService). |
| `infrastructure` | Adapters : repositories en mémoire, SystemClock, UuidGenerator, bcrypt, JWT, crypto. |
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

## Tests

- Tests unitaires : cas d'usage de réservation (8) et d'authentification
  (RegisterUser, LoginUser, RefreshTokens, LogoutUser, GetProfile), avec des
  repositories en mémoire et des doublures rapides, sans base de données.
- Tests d'intégration (Supertest) : endpoint /health, flux d'authentification
  complet, et autorisation par rôle (401 sans token, 403 mauvais rôle, 200 bon
  rôle).
- Total : 32 tests.

## Limites connues

- Persistance : les repositories sont en mémoire. Prisma/PostgreSQL n'est pas
  encore branché ; les données ne survivent pas à un redémarrage.
- Capacité et concurrence : la disponibilité des places est vérifiée en comptant
  les réservations actives avant insertion. En accès concurrent, deux requêtes
  peuvent lire la même valeur avant d'insérer et dépasser la capacité. Au
  branchement de Prisma, cette vérification devra être protégée par une
  transaction sérialisable ou un verrou de ligne (SELECT ... FOR UPDATE),
  complété par une contrainte d'unicité (userId, slotId) contre les doublons.
- Rotation des refresh tokens : la révocation de l'ancien token et l'insertion
  du nouveau se font en deux opérations. Au branchement de Prisma/PostgreSQL,
  les exécuter dans une même transaction pour rendre la rotation atomique et
  éviter tout état incohérent en cas d'échec entre les deux.
- Les routes HTTP de réservation ne sont pas encore exposées : seul le cas
  d'usage et ses tests existent.
- Un seul secret d'access token ; pas de détection de rejeu au-delà du refus
  d'un refresh token déjà révoqué.

## Structure du projet

```
src/
  domain/          entités, value objects, erreurs, policies, interfaces de repositories
  application/     cas d'usage et ports techniques
  infrastructure/  adapters (persistance en mémoire, sécurité, temps, id, config)
  interface/http/  routes, middlewares, gestionnaire d'erreurs, présentateurs
  main/            composition root et serveur
tests/
  unit/            tests des cas d'usage
  integration/     tests HTTP (Supertest)
  fakes/ support/  doublures et utilitaires de test
scripts/
  check-architecture.sh
```
