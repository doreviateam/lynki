#!/bin/bash
# Script d'installation des dépendances Python pour dorevia_billing_core
# Usage: ./SCRIPT_INSTALL_DEPENDANCES.sh

set -e

echo "🔍 Recherche de l'environnement Python d'Odoo..."

# Chercher les environnements virtuels Odoo communs
ODOO_VENV_PATHS=(
    "/opt/odoo/venv"
    "/usr/lib/odoo/venv"
    "/var/lib/odoo/venv"
    "$HOME/odoo/venv"
    "/opt/odoo/odoo/venv"
)

ODOO_VENV=""

# Chercher un environnement virtuel existant
for path in "${ODOO_VENV_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/bin/python" ]; then
        ODOO_VENV="$path"
        echo "✅ Environnement virtuel trouvé: $ODOO_VENV"
        break
    fi
done

# Si aucun environnement virtuel trouvé, chercher le Python d'Odoo via processus
if [ -z "$ODOO_VENV" ]; then
    echo "🔍 Recherche via processus Odoo..."
    ODOO_PYTHON=$(ps aux | grep -i odoo-bin | grep -v grep | awk '{print $11}' | head -1)
    if [ -n "$ODOO_PYTHON" ] && [ -f "$ODOO_PYTHON" ]; then
        ODOO_VENV=$(dirname $(dirname "$ODOO_PYTHON"))
        if [ -d "$ODOO_VENV" ]; then
            echo "✅ Environnement virtuel trouvé via processus: $ODOO_VENV"
        else
            ODOO_VENV=""
        fi
    fi
fi

# Si toujours pas trouvé, demander à l'utilisateur
if [ -z "$ODOO_VENV" ]; then
    echo "❌ Aucun environnement virtuel Odoo trouvé automatiquement."
    echo ""
    echo "Options disponibles :"
    echo "1. Installer via apt (recommandé si disponible)"
    echo "2. Spécifier manuellement le chemin de l'environnement virtuel"
    echo "3. Installer sans PyJWT (le module fonctionnera, mais JWS sera désactivé)"
    echo ""
    read -p "Choisir une option (1/2/3) : " choice
    
    case $choice in
        1)
            echo "📦 Installation via apt..."
            sudo apt-get update
            sudo apt-get install -y python3-pyjwt python3-requests
            echo "✅ Installation terminée via apt"
            exit 0
            ;;
        2)
            read -p "Entrer le chemin de l'environnement virtuel Odoo : " ODOO_VENV
            if [ ! -d "$ODOO_VENV" ] || [ ! -f "$ODOO_VENV/bin/python" ]; then
                echo "❌ Chemin invalide ou Python non trouvé"
                exit 1
            fi
            ;;
        3)
            echo "ℹ️  PyJWT ne sera pas installé. Le module fonctionnera sans vérification JWS."
            echo "✅ Vous pouvez installer le module maintenant dans Odoo."
            exit 0
            ;;
        *)
            echo "❌ Option invalide"
            exit 1
            ;;
    esac
fi

# Installer les dépendances dans l'environnement virtuel Odoo
echo ""
echo "📦 Installation de PyJWT et requests dans: $ODOO_VENV"
echo ""

"$ODOO_VENV/bin/pip" install PyJWT requests

# Vérifier l'installation
echo ""
echo "🔍 Vérification de l'installation..."
"$ODOO_VENV/bin/python" -c "import jwt; print('✅ PyJWT OK')" || echo "❌ PyJWT non disponible"
"$ODOO_VENV/bin/python" -c "import requests; print('✅ requests OK')" || echo "❌ requests non disponible"

echo ""
echo "✅ Installation terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Recharger la page Odoo Apps"
echo "2. Rechercher 'dorevia'"
echo "3. Cliquer sur 'Activer'"
echo ""
echo "Note: Si vous préférez installer sans PyJWT, le module fonctionnera"
echo "      mais la vérification JWS sera désactivée."

