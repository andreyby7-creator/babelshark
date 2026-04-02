#!/usr/bin/env bash
# Создаёт репозиторий на GitHub (если ещё нет origin) и пушит ветку main.
# Требуется: gh auth login -h github.com
#
# Переменные (опционально):
#   GITHUB_REPO_NAME       — имя репо (по умолчанию: babelshark)
#   GITHUB_REPO_VISIBILITY — private | public (по умолчанию: private)

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "Нужен GitHub CLI: https://cli.github.com/"
  exit 1
fi

if ! gh auth status -h github.com &>/dev/null; then
  echo "Выполните вход: gh auth login -h github.com"
  exit 1
fi

if git remote get-url origin &>/dev/null; then
  echo "remote origin уже есть — push в main"
  git push -u origin main
  exit 0
fi

NAME="${GITHUB_REPO_NAME:-babelshark}"
VIS="${GITHUB_REPO_VISIBILITY:-private}"

if [[ "$VIS" == "public" ]]; then
  gh repo create "$NAME" --public --source=. --remote=origin --push
else
  gh repo create "$NAME" --private --source=. --remote=origin --push
fi
