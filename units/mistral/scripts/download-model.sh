#!/bin/bash
# Télécharge le modèle GGUF Mistral-7B Q4_K_M depuis Hugging Face
# Usage : exécuter depuis la racine du projet (/opt/dorevia-plateform)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="$(dirname "$SCRIPT_DIR")/models"
MODEL_FILE="mistral-7b-instruct-v0.2.Q4_K_M.gguf"
URL="https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/${MODEL_FILE}"

mkdir -p "$MODELS_DIR"
cd "$MODELS_DIR"

if [ -f "$MODEL_FILE" ]; then
  echo "Modèle déjà présent : $MODELS_DIR/$MODEL_FILE"
  ls -lh "$MODEL_FILE"
  exit 0
fi

echo "Téléchargement de $MODEL_FILE (~4,4 Go)..."
wget -O "$MODEL_FILE" "$URL"
echo "✅ Téléchargement terminé : $MODELS_DIR/$MODEL_FILE"
ls -lh "$MODEL_FILE"
