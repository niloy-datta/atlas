#!/usr/bin/env sh
set -eu

repository_root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$repository_root"

docker compose config --quiet

cd backend
./mvnw clean verify

cd ../frontend
npm run lint
npm run typecheck
npm test
npm run build

