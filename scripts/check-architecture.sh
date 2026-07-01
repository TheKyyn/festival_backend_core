#!/usr/bin/env sh
# Garde-fou Clean Architecture.
# Le coeur (domain/ + application/) ne doit importer aucun framework ni outil
# d'infrastructure. La detection porte sur le specificateur de module entre
# guillemets, ce qui couvre les trois formes :
#   - import ... from "<module>"
#   - require("<module>")
#   - import("<module>")
set -eu

DIRS="src/domain src/application"
# Modules interdits dans le coeur.
PATTERN="['\"](express|@?prisma(/client)?|jsonwebtoken|bcryptjs?|argon2|jose)['\"]"

if command -v rg >/dev/null 2>&1; then
  MATCHES=$(rg -n --no-heading "$PATTERN" $DIRS || true)
else
  MATCHES=$(grep -rnE "$PATTERN" $DIRS || true)
fi

if [ -n "$MATCHES" ]; then
  echo "ECHEC : import/require/import() interdit dans domain/ ou application/ :"
  echo "$MATCHES"
  exit 1
fi

echo "OK : aucun import interdit dans domain/ et application/"
