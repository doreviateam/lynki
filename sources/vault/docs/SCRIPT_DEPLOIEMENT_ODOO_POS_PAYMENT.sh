#!/bin/bash
# Script de déploiement — Module Dorevia Vault POS Payment
# Date : 2025-12-14
# Usage : ./SCRIPT_DEPLOIEMENT_ODOO_POS_PAYMENT.sh [chemin_addons_odoo]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les arguments
if [ -z "$1" ]; then
    error "Usage: $0 <chemin_addons_odoo>"
    error "Exemple: $0 /opt/odoo/addons"
    exit 1
fi

ODOO_ADDONS_PATH="$1"
MODULE_NAME="dorevia_vault_pos_payment"
MODULE_SOURCE="/opt/dorevia-vault/docs/ODOO_MODULE_POS_PAYMENT_VAULT"
MODULE_TARGET="${ODOO_ADDONS_PATH}/${MODULE_NAME}"

info "=== Déploiement Module Dorevia Vault POS Payment ==="
info "Source: ${MODULE_SOURCE}"
info "Cible: ${MODULE_TARGET}"

# Vérifier que le répertoire source existe
if [ ! -d "$MODULE_SOURCE" ]; then
    error "Le répertoire source n'existe pas: ${MODULE_SOURCE}"
    exit 1
fi

# Vérifier que le répertoire addons existe
if [ ! -d "$ODOO_ADDONS_PATH" ]; then
    error "Le répertoire addons n'existe pas: ${ODOO_ADDONS_PATH}"
    error "Création du répertoire..."
    mkdir -p "$ODOO_ADDONS_PATH"
fi

# Vérifier si le module existe déjà
if [ -d "$MODULE_TARGET" ]; then
    warn "Le module existe déjà: ${MODULE_TARGET}"
    read -p "Voulez-vous le remplacer ? (o/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        info "Déploiement annulé."
        exit 0
    fi
    info "Suppression de l'ancien module..."
    rm -rf "$MODULE_TARGET"
fi

# Copier le module
info "Copie du module..."
cp -r "$MODULE_SOURCE" "$MODULE_TARGET"

# Définir les permissions
info "Définition des permissions..."
chmod -R 755 "$MODULE_TARGET"
find "$MODULE_TARGET" -type f -exec chmod 644 {} \;

# Vérifier PyJWT
info "Vérification de PyJWT..."
if python3 -c "import jwt" 2>/dev/null; then
    info "PyJWT est déjà installé."
else
    warn "PyJWT n'est pas installé."
    read -p "Voulez-vous l'installer maintenant ? (o/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        info "Installation de PyJWT..."
        pip3 install PyJWT
        info "PyJWT installé avec succès."
    else
        warn "PyJWT doit être installé manuellement: pip3 install PyJWT"
    fi
fi

# Résumé
info "=== Déploiement terminé ==="
info "Module installé dans: ${MODULE_TARGET}"
info ""
info "Prochaines étapes:"
info "1. Dans Odoo: Apps > Update Apps List"
info "2. Rechercher 'Dorevia Vault POS Payment'"
info "3. Installer le module"
info ""
info "Configuration optionnelle:"
info "- Paramètre système: dorevia.vault.url = https://vault.doreviateam.com"

