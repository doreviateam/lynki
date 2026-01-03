#!/usr/bin/env bash
# ============================================
# Script de Diagnostic Automatisé
# Document FAC/2025/00020
# Vault ID: 85852790-be9e-4432-84c0-a3f00ed2353e
# Odoo ID: 1521
# Date: 2025-12-10 21:28:25 UTC
# ============================================

set -euo pipefail

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
VAULT_ID="85852790-be9e-4432-84c0-a3f00ed2353e"
ODOO_ID="1521"
ODOO_MODEL="account.move"
TENANT="1"
DATE_START="2025-12-10 21:27:25"
DATE_END="2025-12-10 21:29:25"
TIMESTAMP_LOG="2025-12-10 21:28:25"

# Fichiers de sortie
OUTPUT_DIR="/tmp/diagnostic_fac_00020_$(date +%Y%m%d_%H%M%S)"
SQL_RESULTS="${OUTPUT_DIR}/sql_results.txt"
LOG_RESULTS="${OUTPUT_DIR}/log_results.txt"
FILE_RESULTS="${OUTPUT_DIR}/file_results.txt"
REPORT="${OUTPUT_DIR}/diagnostic_report.md"

# Créer le répertoire de sortie
mkdir -p "${OUTPUT_DIR}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}DIAGNOSTIC AUTOMATISÉ - Document FAC/2025/00020${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "📁 Répertoire de sortie : ${OUTPUT_DIR}"
echo ""

# ============================================
# 1. VÉRIFICATION PRÉREQUIS
# ============================================

echo -e "${YELLOW}[1/5] Vérification des prérequis...${NC}"

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
    
    # Si toujours pas défini, essayer depuis .env
    if [ -z "${DATABASE_URL:-}" ] && [ -f "/opt/dorevia-vault/.env" ]; then
        DB_URL_FROM_ENV=$(grep "^DATABASE_URL=" /opt/dorevia-vault/.env | cut -d'=' -f2- | tr -d '"' || true)
        if [ -n "${DB_URL_FROM_ENV:-}" ]; then
            export DATABASE_URL="${DB_URL_FROM_ENV}"
            echo -e "${GREEN}✅ DATABASE_URL récupéré depuis .env${NC}"
        fi
    fi
    
    # Si toujours pas défini, demander à l'utilisateur
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

# Vérifier la connexion à la base de données
if ! psql "${DATABASE_URL}" -c "SELECT 1;" &> /dev/null; then
    echo -e "${RED}❌ ERREUR: Impossible de se connecter à la base de données${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connexion à la base de données réussie${NC}"

echo ""

# ============================================
# 2. DIAGNOSTIC SQL
# ============================================

echo -e "${YELLOW}[2/5] Exécution des requêtes SQL...${NC}"

{
    echo "============================================"
    echo "RÉSULTATS DES REQUÊTES SQL"
    echo "============================================"
    echo ""
    echo "Date d'exécution : $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
    echo ""
    
    # Requête 1 : Vérification par vault_id
    echo "---"
    echo "REQUÊTE 1 : Vérification par vault_id"
    echo "---"
    psql "${DATABASE_URL}" -t -A -F " | " <<EOF
SELECT 
    CASE 
        WHEN id IS NOT NULL THEN '✅ DOCUMENT TROUVÉ'
        ELSE '❌ DOCUMENT NON TROUVÉ'
    END as statut,
    id,
    filename,
    sha256_hex,
    created_at,
    COALESCE(tenant, 'NULL') as tenant,
    CASE WHEN evidence_jws IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_jws,
    CASE WHEN ledger_hash IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_ledger,
    stored_path
FROM documents
WHERE id = '${VAULT_ID}';
EOF
    echo ""
    
    # Requête 2 : Recherche par Odoo ID
    echo "---"
    echo "REQUÊTE 2 : Recherche par Odoo ID (${ODOO_ID}) et modèle (${ODOO_MODEL})"
    echo "---"
    psql "${DATABASE_URL}" -t -A -F " | " <<EOF
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' DOCUMENT(S) TROUVÉ(S)'
        ELSE '❌ AUCUN DOCUMENT TROUVÉ'
    END as statut,
    id,
    filename,
    sha256_hex,
    created_at,
    COALESCE(tenant, 'NULL') as tenant,
    odoo_model,
    odoo_id,
    CASE WHEN evidence_jws IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_jws,
    CASE WHEN ledger_hash IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_ledger
FROM documents
WHERE odoo_model = '${ODOO_MODEL}'
  AND odoo_id = ${ODOO_ID}
GROUP BY id, filename, sha256_hex, created_at, tenant, odoo_model, odoo_id, evidence_jws, ledger_hash
ORDER BY created_at DESC;
EOF
    echo ""
    
    # Requête 3 : Documents créés autour de cette date
    echo "---"
    echo "REQUÊTE 3 : Documents créés autour de ${TIMESTAMP_LOG} (±1 minute)"
    echo "---"
    psql "${DATABASE_URL}" -t -A -F " | " <<EOF
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' DOCUMENT(S) TROUVÉ(S)'
        ELSE '❌ AUCUN DOCUMENT TROUVÉ'
    END as statut,
    id,
    filename,
    sha256_hex,
    created_at,
    COALESCE(tenant, 'NULL') as tenant,
    odoo_model,
    odoo_id
FROM documents
WHERE created_at BETWEEN '${DATE_START}'::timestamp AND '${DATE_END}'::timestamp
GROUP BY id, filename, sha256_hex, created_at, tenant, odoo_model, odoo_id
ORDER BY created_at DESC;
EOF
    echo ""
    
    # Requête 4 : Documents avec tenant = '1' créés ce jour
    echo "---"
    echo "REQUÊTE 4 : Documents avec tenant = '1' créés le 2025-12-10"
    echo "---"
    psql "${DATABASE_URL}" -t -A -F " | " <<EOF
SELECT 
    COUNT(*) as total_documents,
    COUNT(CASE WHEN id = '${VAULT_ID}' THEN 1 END) as document_cible_trouve,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM documents
WHERE tenant = '${TENANT}'
  AND created_at::date = '2025-12-10'::date;
EOF
    echo ""
    
    # Requête 5 : Documents sans tenant créés ce jour
    echo "---"
    echo "REQUÊTE 5 : Documents sans tenant créés le 2025-12-10"
    echo "---"
    psql "${DATABASE_URL}" -t -A -F " | " <<EOF
SELECT 
    COUNT(*) as total_documents,
    COUNT(CASE WHEN id = '${VAULT_ID}' THEN 1 END) as document_cible_trouve,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM documents
WHERE tenant IS NULL
  AND created_at::date = '2025-12-10'::date;
EOF
    echo ""
    
    # Requête 6 : Recherche par UUID partiel
    echo "---"
    echo "REQUÊTE 6 : Recherche par UUID partiel (85852790-be9e)"
    echo "---"
    psql "${DATABASE_URL}" -t -A -F " | " <<EOF
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' DOCUMENT(S) TROUVÉ(S)'
        ELSE '❌ AUCUN DOCUMENT TROUVÉ'
    END as statut,
    id,
    filename,
    sha256_hex,
    created_at,
    COALESCE(tenant, 'NULL') as tenant,
    odoo_model,
    odoo_id
FROM documents
WHERE id::text LIKE '85852790-be9e%'
GROUP BY id, filename, sha256_hex, created_at, tenant, odoo_model, odoo_id
ORDER BY created_at DESC;
EOF
    echo ""
    
    # Requête 7 : Statistiques générales
    echo "---"
    echo "REQUÊTE 7 : Statistiques générales - 2025-12-10"
    echo "---"
    psql "${DATABASE_URL}" -t -A -F " | " <<EOF
SELECT 
    COUNT(*) as total_documents,
    COUNT(DISTINCT tenant) as tenants_distincts,
    COUNT(CASE WHEN evidence_jws IS NOT NULL THEN 1 END) as avec_jws,
    COUNT(CASE WHEN ledger_hash IS NOT NULL THEN 1 END) as avec_ledger,
    MIN(created_at) as premier_document,
    MAX(created_at) as dernier_document
FROM documents
WHERE created_at::date = '2025-12-10'::date;
EOF
    echo ""
    
} > "${SQL_RESULTS}" 2>&1

echo -e "${GREEN}✅ Requêtes SQL exécutées${NC}"
echo "   Résultats sauvegardés dans : ${SQL_RESULTS}"
echo ""

# ============================================
# 3. VÉRIFICATION DES LOGS
# ============================================

echo -e "${YELLOW}[3/5] Vérification des logs Vault...${NC}"

{
    echo "============================================"
    echo "RÉSULTATS DE LA VÉRIFICATION DES LOGS"
    echo "============================================"
    echo ""
    echo "Période analysée : ${DATE_START} - ${DATE_END} UTC"
    echo ""
    
    # Vérifier si systemd est disponible
    if systemctl is-active --quiet dorevia-vault 2>/dev/null; then
        echo "---"
        echo "LOGS SYSTEMD (journalctl)"
        echo "---"
        sudo journalctl -u dorevia-vault \
            --since "${DATE_START}" \
            --until "${DATE_END}" \
            --no-pager | grep -E "(85852790|be9e|FAC/2025/00020|1521|account.move_1521|correlation_id.*8607e3e7)" || echo "Aucun log trouvé pour cette période"
        echo ""
    else
        echo "⚠️  Service systemd non disponible ou non actif"
    fi
    
    # Vérifier les logs dans /var/log
    if [ -d "/var/log/dorevia-vault" ]; then
        echo "---"
        echo "LOGS FICHIERS (/var/log/dorevia-vault)"
        echo "---"
        find /var/log/dorevia-vault -type f -name "*.log" -exec grep -H -E "(85852790|be9e|FAC/2025/00020|1521|account.move_1521|correlation_id.*8607e3e7)" {} \; || echo "Aucun log trouvé"
        echo ""
    fi
    
    # Vérifier les logs dans le répertoire du projet
    if [ -d "/opt/dorevia-vault/logs" ]; then
        echo "---"
        echo "LOGS PROJET (/opt/dorevia-vault/logs)"
        echo "---"
        find /opt/dorevia-vault/logs -type f -name "*.log" -exec grep -H -E "(85852790|be9e|FAC/2025/00020|1521|account.move_1521|correlation_id.*8607e3e7)" {} \; || echo "Aucun log trouvé"
        echo ""
    fi
    
} > "${LOG_RESULTS}" 2>&1

echo -e "${GREEN}✅ Vérification des logs terminée${NC}"
echo "   Résultats sauvegardés dans : ${LOG_RESULTS}"
echo ""

# ============================================
# 4. VÉRIFICATION DES FICHIERS SUR DISQUE
# ============================================

echo -e "${YELLOW}[4/5] Vérification des fichiers sur disque...${NC}"

{
    echo "============================================"
    echo "RÉSULTATS DE LA VÉRIFICATION DES FICHIERS"
    echo "============================================"
    echo ""
    echo "Répertoire de stockage : /opt/dorevia-vault/storage"
    echo ""
    
    # Recherche par UUID complet
    echo "---"
    echo "RECHERCHE 1 : Par UUID complet (85852790-be9e-4432-84c0-a3f00ed2353e)"
    echo "---"
    find /opt/dorevia-vault/storage -name "*85852790-be9e*" -o -name "*85852790*" 2>/dev/null | while read -r file; do
        if [ -f "$file" ]; then
            echo "✅ Fichier trouvé : $file"
            ls -lh "$file" | awk '{print "   Taille: " $5 ", Date: " $6 " " $7 " " $8}'
        fi
    done || echo "❌ Aucun fichier trouvé"
    echo ""
    
    # Recherche dans la date attendue
    echo "---"
    echo "RECHERCHE 2 : Dans la date attendue (2025/12/10)"
    echo "---"
    if [ -d "/opt/dorevia-vault/storage/2025/12/10" ]; then
        echo "Répertoire existe : /opt/dorevia-vault/storage/2025/12/10"
        ls -lah /opt/dorevia-vault/storage/2025/12/10/ | grep -E "(85852790|be9e)" || echo "❌ Aucun fichier correspondant trouvé"
        echo ""
        echo "Tous les fichiers créés dans cette période :"
        find /opt/dorevia-vault/storage/2025/12/10/ -type f -newermt "${DATE_START}" ! -newermt "${DATE_END}" -ls 2>/dev/null || echo "Aucun fichier trouvé"
    else
        echo "❌ Répertoire n'existe pas : /opt/dorevia-vault/storage/2025/12/10"
    fi
    echo ""
    
    # Recherche par UUID partiel
    echo "---"
    echo "RECHERCHE 3 : Par UUID partiel (85852790-be9e)"
    echo "---"
    find /opt/dorevia-vault/storage -name "*85852790*" -o -name "*be9e*" 2>/dev/null | head -20 || echo "❌ Aucun fichier trouvé"
    echo ""
    
} > "${FILE_RESULTS}" 2>&1

echo -e "${GREEN}✅ Vérification des fichiers terminée${NC}"
echo "   Résultats sauvegardés dans : ${FILE_RESULTS}"
echo ""

# ============================================
# 5. GÉNÉRATION DU RAPPORT
# ============================================

echo -e "${YELLOW}[5/5] Génération du rapport...${NC}"

{
    cat <<EOF
# 📊 Rapport de Diagnostic - Document FAC/2025/00020

**Date d'exécution** : $(date -u +"%Y-%m-%d %H:%M:%S UTC")  
**Vault ID** : ${VAULT_ID}  
**Odoo ID** : ${ODOO_ID}  
**Odoo Model** : ${ODOO_MODEL}  
**Tenant** : ${TENANT}  
**Date vaultérisation** : ${TIMESTAMP_LOG} UTC

---

## 📋 Résultats du Diagnostic SQL

\`\`\`
$(cat "${SQL_RESULTS}")
\`\`\`

---

## 📋 Résultats de la Vérification des Logs

\`\`\`
$(cat "${LOG_RESULTS}")
\`\`\`

---

## 📋 Résultats de la Vérification des Fichiers

\`\`\`
$(cat "${FILE_RESULTS}")
\`\`\`

---

## 🔍 Analyse et Recommandations

### Scénario Identifié

[À compléter manuellement selon les résultats]

- [ ] **Scénario A** : Document trouvé avec le vault_id correct
- [ ] **Scénario B** : Document trouvé avec un autre vault_id
- [ ] **Scénario C** : Document non trouvé

### Actions Recommandées

[À compléter manuellement selon les résultats]

---

## 📁 Fichiers Générés

- **Résultats SQL** : \`${SQL_RESULTS}\`
- **Résultats Logs** : \`${LOG_RESULTS}\`
- **Résultats Fichiers** : \`${FILE_RESULTS}\`
- **Rapport complet** : \`${REPORT}\`

---

**Fin du Rapport**

EOF
} > "${REPORT}"

echo -e "${GREEN}✅ Rapport généré${NC}"
echo "   Rapport sauvegardé dans : ${REPORT}"
echo ""

# ============================================
# RÉSUMÉ
# ============================================

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✅ DIAGNOSTIC TERMINÉ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "📁 Tous les résultats sont disponibles dans : ${OUTPUT_DIR}"
echo ""
echo "📄 Fichiers générés :"
echo "   - ${SQL_RESULTS}"
echo "   - ${LOG_RESULTS}"
echo "   - ${FILE_RESULTS}"
echo "   - ${REPORT}"
echo ""
echo "🔍 Prochaines étapes :"
echo "   1. Examiner le rapport : ${REPORT}"
echo "   2. Analyser les résultats selon les scénarios"
echo "   3. Créer la réponse complémentaire avec les résultats"
echo "   4. Envoyer la réponse à l'équipe Odoo"
echo ""
