#!/usr/bin/env bash
# ============================================
# Script de Diagnostic Automatisé
# Factures sans JWS : FAC/2025/00019 et FAC/2025/00018
# ============================================

set -euo pipefail

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables FAC/2025/00019
FAC_00019_VAULT_ID="08dc880b-10c2-4375-932f-34772638e276"
FAC_00019_ODOO_ID="1517"
FAC_00019_DATE_START="2025-12-10 20:45:20"
FAC_00019_DATE_END="2025-12-10 20:49:20"
FAC_00019_CORRELATION_ID="account.move_1517_d5e27cf8"

# Variables FAC/2025/00018
FAC_00018_VAULT_ID="bbdd87e8-37d7-4bf9-8a32-be1b7024adff"
FAC_00018_ODOO_ID="1516"
FAC_00018_DATE_START="2025-12-10 20:28:18"
FAC_00018_DATE_END="2025-12-10 20:32:18"
FAC_00018_CORRELATION_ID="account.move_1516_85f4b2ec"

# Fichiers de sortie
OUTPUT_DIR="/tmp/diagnostic_factures_sans_jws_$(date +%Y%m%d_%H%M%S)"
FAC_00019_RESULTS="${OUTPUT_DIR}/fac_00019_results.txt"
FAC_00018_RESULTS="${OUTPUT_DIR}/fac_00018_results.txt"
REPORT="${OUTPUT_DIR}/diagnostic_report.md"

# Créer le répertoire de sortie
mkdir -p "${OUTPUT_DIR}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}DIAGNOSTIC AUTOMATISÉ - Factures sans JWS${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "📁 Répertoire de sortie : ${OUTPUT_DIR}"
echo ""

# ============================================
# 1. VÉRIFICATION PRÉREQUIS
# ============================================

echo -e "${YELLOW}[1/4] Vérification des prérequis...${NC}"

# Vérifier DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL non défini dans l'environnement${NC}"
    echo "   Tentative de récupération depuis le service systemd..."
    
    # Essayer de récupérer depuis le service systemd (override.conf en priorité)
    if [ -f "/etc/systemd/system/dorevia-vault.service.d/override.conf" ]; then
        DB_URL_FROM_SERVICE=$(grep -E "Environment.*DATABASE_URL" /etc/systemd/system/dorevia-vault.service.d/override.conf | sed 's/.*DATABASE_URL=\([^"]*\).*/\1/' | tr -d '"' || true)
        if [ -n "${DB_URL_FROM_SERVICE:-}" ]; then
            export DATABASE_URL="${DB_URL_FROM_SERVICE}"
            echo -e "${GREEN}✅ DATABASE_URL récupéré depuis override.conf${NC}"
        fi
    fi
    
    # Si toujours pas trouvé, essayer le fichier service principal
    if [ -z "${DATABASE_URL:-}" ] && [ -f "/etc/systemd/system/dorevia-vault.service" ]; then
        DB_URL_FROM_SERVICE=$(grep -E "Environment.*DATABASE_URL" /etc/systemd/system/dorevia-vault.service | sed 's/.*DATABASE_URL=\([^"]*\).*/\1/' | tr -d '"' || true)
        if [ -n "${DB_URL_FROM_SERVICE:-}" ]; then
            export DATABASE_URL="${DB_URL_FROM_SERVICE}"
            echo -e "${GREEN}✅ DATABASE_URL récupéré depuis le service systemd${NC}"
        fi
    fi
    
    # Si toujours pas trouvé, essayer depuis .env
    if [ -z "${DATABASE_URL:-}" ] && [ -f "/opt/dorevia-vault/.env" ]; then
        DB_URL_FROM_ENV=$(grep "^DATABASE_URL=" /opt/dorevia-vault/.env | cut -d'=' -f2- | tr -d '"' || true)
        if [ -n "${DB_URL_FROM_ENV:-}" ]; then
            export DATABASE_URL="${DB_URL_FROM_ENV}"
            echo -e "${GREEN}✅ DATABASE_URL récupéré depuis .env${NC}"
        fi
    fi
    
    # Si toujours pas trouvé, demander à l'utilisateur
    if [ -z "${DATABASE_URL:-}" ]; then
        echo ""
        echo -e "${YELLOW}Veuillez fournir DATABASE_URL :${NC}"
        echo "   Format: postgres://user:password@host:port/database?sslmode=disable"
        read -p "DATABASE_URL: " db_url
        if [ -n "$db_url" ]; then
            export DATABASE_URL="$db_url"
            echo -e "${GREEN}✅ DATABASE_URL défini${NC}"
        else
            echo -e "${RED}❌ ERREUR: DATABASE_URL est requis pour exécuter le diagnostic${NC}"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✅ DATABASE_URL défini${NC}"
fi

# Vérifier psql
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ ERREUR: psql n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ psql disponible${NC}"

# Tester la connexion
if ! psql "${DATABASE_URL}" -c "SELECT 1;" &> /dev/null; then
    echo -e "${RED}❌ ERREUR: Impossible de se connecter à la base de données${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connexion à la base de données réussie${NC}"
echo ""

# ============================================
# 2. DIAGNOSTIC FAC/2025/00019
# ============================================

echo -e "${YELLOW}[2/4] Diagnostic FAC/2025/00019...${NC}"

{
    echo "============================================"
    echo "DIAGNOSTIC FAC/2025/00019"
    echo "============================================"
    echo ""
    echo "Vault ID (Odoo): ${FAC_00019_VAULT_ID}"
    echo "Odoo ID: ${FAC_00019_ODOO_ID}"
    echo "Période: ${FAC_00019_DATE_START} - ${FAC_00019_DATE_END}"
    echo ""
    
    echo "---"
    echo "REQUÊTE 1 : Vérification par vault_id"
    echo "---"
    psql "${DATABASE_URL}" -t -A -F " | " -c "
        SELECT 
            id,
            filename,
            sha256_hex,
            created_at,
            tenant,
            CASE WHEN evidence_jws IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_jws,
            CASE WHEN ledger_hash IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_ledger
        FROM documents
        WHERE id = '${FAC_00019_VAULT_ID}';
    " || echo "Aucun résultat"
    echo ""
    
    echo "---"
    echo "REQUÊTE 2 : Recherche par Odoo ID"
    echo "---"
    psql "${DATABASE_URL}" -t -A -F " | " -c "
        SELECT 
            id,
            filename,
            sha256_hex,
            created_at,
            tenant,
            odoo_model,
            odoo_id,
            CASE WHEN evidence_jws IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_jws,
            CASE WHEN ledger_hash IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_ledger
        FROM documents
        WHERE odoo_model = 'account.move'
          AND odoo_id = ${FAC_00019_ODOO_ID}
        ORDER BY created_at DESC;
    " || echo "Aucun résultat"
    echo ""
    
    echo "---"
    echo "REQUÊTE 3 : Documents créés autour de ${FAC_00019_DATE_START}"
    echo "---"
    RESULT=$(psql "${DATABASE_URL}" -t -A -F " | " -c "
        SELECT 
            id,
            filename,
            sha256_hex,
            created_at,
            tenant,
            CASE WHEN evidence_jws IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_jws,
            CASE WHEN ledger_hash IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_ledger
        FROM documents
        WHERE created_at BETWEEN '${FAC_00019_DATE_START}'::timestamp 
                             AND '${FAC_00019_DATE_END}'::timestamp
        ORDER BY created_at DESC;
    " || echo "")
    
    if [ -n "$RESULT" ]; then
        echo "✅ DOCUMENT(S) TROUVÉ(S)"
        echo "$RESULT"
    else
        echo "❌ Aucun document trouvé"
    fi
    echo ""
    
} > "${FAC_00019_RESULTS}"

echo -e "${GREEN}✅ Diagnostic FAC/2025/00019 terminé${NC}"
echo "   Résultats sauvegardés dans : ${FAC_00019_RESULTS}"
echo ""

# ============================================
# 3. DIAGNOSTIC FAC/2025/00018
# ============================================

echo -e "${YELLOW}[3/4] Diagnostic FAC/2025/00018...${NC}"

{
    echo "============================================"
    echo "DIAGNOSTIC FAC/2025/00018"
    echo "============================================"
    echo ""
    echo "Vault ID (Odoo): ${FAC_00018_VAULT_ID}"
    echo "Odoo ID: ${FAC_00018_ODOO_ID}"
    echo "Période: ${FAC_00018_DATE_START} - ${FAC_00018_DATE_END}"
    echo ""
    
    echo "---"
    echo "REQUÊTE 1 : Vérification par vault_id"
    echo "---"
    psql "${DATABASE_URL}" -t -A -F " | " -c "
        SELECT 
            id,
            filename,
            sha256_hex,
            created_at,
            tenant,
            CASE WHEN evidence_jws IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_jws,
            CASE WHEN ledger_hash IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_ledger
        FROM documents
        WHERE id = '${FAC_00018_VAULT_ID}';
    " || echo "Aucun résultat"
    echo ""
    
    echo "---"
    echo "REQUÊTE 2 : Recherche par Odoo ID"
    echo "---"
    psql "${DATABASE_URL}" -t -A -F " | " -c "
        SELECT 
            id,
            filename,
            sha256_hex,
            created_at,
            tenant,
            odoo_model,
            odoo_id,
            CASE WHEN evidence_jws IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_jws,
            CASE WHEN ledger_hash IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_ledger
        FROM documents
        WHERE odoo_model = 'account.move'
          AND odoo_id = ${FAC_00018_ODOO_ID}
        ORDER BY created_at DESC;
    " || echo "Aucun résultat"
    echo ""
    
    echo "---"
    echo "REQUÊTE 3 : Documents créés autour de ${FAC_00018_DATE_START}"
    echo "---"
    RESULT=$(psql "${DATABASE_URL}" -t -A -F " | " -c "
        SELECT 
            id,
            filename,
            sha256_hex,
            created_at,
            tenant,
            CASE WHEN evidence_jws IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_jws,
            CASE WHEN ledger_hash IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_ledger
        FROM documents
        WHERE created_at BETWEEN '${FAC_00018_DATE_START}'::timestamp 
                             AND '${FAC_00018_DATE_END}'::timestamp
        ORDER BY created_at DESC;
    " || echo "")
    
    if [ -n "$RESULT" ]; then
        echo "✅ DOCUMENT(S) TROUVÉ(S)"
        echo "$RESULT"
    else
        echo "❌ Aucun document trouvé"
    fi
    echo ""
    
} > "${FAC_00018_RESULTS}"

echo -e "${GREEN}✅ Diagnostic FAC/2025/00018 terminé${NC}"
echo "   Résultats sauvegardés dans : ${FAC_00018_RESULTS}"
echo ""

# ============================================
# 4. GÉNÉRATION DU RAPPORT
# ============================================

echo -e "${YELLOW}[4/4] Génération du rapport...${NC}"

{
    cat << EOF
# 📊 Rapport de Diagnostic - Factures sans JWS

**Date d'exécution** : $(date -u +"%Y-%m-%d %H:%M:%S UTC")  
**Factures analysées** : FAC/2025/00019, FAC/2025/00018

---

## 📋 Résultats FAC/2025/00019

\`\`\`
$(cat "${FAC_00019_RESULTS}")
\`\`\`

---

## 📋 Résultats FAC/2025/00018

\`\`\`
$(cat "${FAC_00018_RESULTS}")
\`\`\`

---

## 🔍 Analyse et Recommandations

[À compléter manuellement selon les résultats]

### FAC/2025/00019

- [ ] **Scénario A** : Document trouvé avec le vault_id correct
- [ ] **Scénario B** : Document trouvé avec un autre vault_id
- [ ] **Scénario C** : Document non trouvé

### FAC/2025/00018

- [ ] **Scénario A** : Document trouvé avec le vault_id correct
- [ ] **Scénario B** : Document trouvé avec un autre vault_id
- [ ] **Scénario C** : Document non trouvé

---

## 📁 Fichiers Générés

- **Résultats FAC/2025/00019** : \`${FAC_00019_RESULTS}\`
- **Résultats FAC/2025/00018** : \`${FAC_00018_RESULTS}\`
- **Rapport complet** : \`${REPORT}\`

---

**Fin du Rapport**
EOF
} > "${REPORT}"

echo -e "${GREEN}✅ Rapport généré${NC}"
echo "   Rapport sauvegardé dans : ${REPORT}"
echo ""

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✅ DIAGNOSTIC TERMINÉ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "📁 Tous les résultats sont disponibles dans : ${OUTPUT_DIR}"
echo ""
echo "📄 Fichiers générés :"
echo "   - ${FAC_00019_RESULTS}"
echo "   - ${FAC_00018_RESULTS}"
echo "   - ${REPORT}"
echo ""
