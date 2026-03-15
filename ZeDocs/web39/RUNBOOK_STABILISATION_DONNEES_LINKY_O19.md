# Runbook — Stabilisation des données Linky o19 (Odoo ↔ Vault)

**Objectif** : Afficher dans DOREVIA Linky des **données réelles à jour**, alignées entre Odoo o19 et le Vault, sans incohérences ni affichage différent à chaque mise à jour. **Vérité totale** : Linky doit proposer une vérité totale à l'utilisateur — une seule source de vérité, clairement indiquée (footer + cartes).

## 1. Principe : une source de vérité pour l’affichage

Pour le tenant **o19**, Linky privilégie **Odoo** comme source pour les indicateurs opérationnels (ventes, achats, trésorerie / paiements). Le **Vault** reste la source pour le nombre de **preuves scellées** et les documents déjà ingérés. L'interface affiche explicitement la source : « Vérité : indicateurs ERP (Odoo) » ou « Vérité : documents scellés (Vault) » dans le footer ; les cartes Trésorerie et Business indiquent « Source : ERP (Odoo) — vérité unique » lorsque la donnée vient de l'ERP.

| Donnée affichée dans Linky | Source (o19) | Pourquoi |
|----------------------------|-------------|----------|
| **Trésorerie** (solde, rapproché, à rapprocher) | Odoo (via Vault proxy) | Vault appelle `ODOO_BANK_RECONCILIATION_URL_O19` → données ERP à jour |
| **Paiements** (total période, à rapprocher) | Odoo (idem) | Même chaîne Trésorerie / payments-completeness |
| **Business** (ventes HT, achats HT, marge) | Odoo (direct) | Linky appelle `ODOO_O19_URL` → `/dorevia/vault/linky_business_aggregation` → agrégats ERP |
| **Grille d’accueil** (tuiles Paiements, Business, etc.) | Idem (Odoo pour o19) | `dashboard-metrics` utilise la même logique : o19 + ODOO_O19_URL → Odoo |
| **Preuves scellées** (badge header/footer) | Vault | `GET /ui/completeness-snapshot` — nombre de documents déjà vaultés |

Résultat : **affichage stable** (grille = carte détaillée), **données à jour** (Odoo = source de vérité) et **vérité totale** (l’utilisateur voit clairement d’où viennent les chiffres). La synchronisation Odoo → Vault (DVIG) alimente le Vault pour les preuves et le rattrapage progressif.

## 3. Configuration requise pour la stabilisation

### 3.1 Linky (instance o19)

**Fichier** : `tenants/o19/apps/ui/lab/docker-compose.yml`

Variables **obligatoires** pour des données synchronisées :

| Variable | Rôle | Exemple |
|----------|------|--------|
| `TENANT_ID` | Tenant affiché et envoyé au Vault | `o19` |
| `ODOO_O19_URL` | URL base Odoo o19 pour ventes/achats (carte Business + grille) | `http://odoo_lab_o19:8069` |
| `VAULT_URL` | URL du Vault (trésorerie, preuves, complétude) | `http://vault-core-stinger:8080` |

Sans `ODOO_O19_URL`, la carte Business et la grille utilisent uniquement le Vault (documents déjà ingérés) → chiffres partiels ou différents à chaque déploiement.

### 3.2 Vault

**Compose** (ex. `tenants/core-stinger/platform/docker-compose.yml`) :

| Variable | Rôle |
|----------|------|
| `ODOO_BANK_RECONCILIATION_URL_O19` | URL complète du endpoint Odoo rapprochement (ex. `http://odoo_lab_o19:8069/dorevia/vault/linky_bank_reconciliation`) pour trésorerie / paiements tenant o19 |

### 3.3 Odoo o19

- **DVIG** : `ODOO_DVIG_URL`, `ODOO_DVIG_TENANT` (o19), `ODOO_DVIG_TOKEN` (ou paramètres techniques) pour envoyer paiements et mouvements vers le Vault.
- **Backfill rapprochement** : exécuter au besoin `run_backfill_reconcil_o19.sh` (voir `RUNBOOK_VAULT_RECONCIL_O19.md`).

## 4. Vérifications après déploiement / mise à jour

1. **Linky o19** : le conteneur a bien `ODOO_O19_URL` (et `TENANT_ID=o19`). Redémarrer le conteneur après modification du compose pour recharger les variables.
2. **Réseau** : depuis le conteneur Linky, résolution de `odoo_lab_o19` (ou l’hôte défini dans `ODOO_O19_URL`) et accès au port 8069 ; depuis le Vault, accès à l’URL de `ODOO_BANK_RECONCILIATION_URL_O19`.
3. **Cohérence** : ouvrir la grille Linky (o19) puis la carte Business → les montants Business doivent être identiques (ex. + 4 387 € partout si c’est le chiffre ERP). La trésorerie doit refléter les montants Odoo (996 € rapproché, 3 391 € à rapprocher si tel est le cas en base).

## 5. Synchronisation Odoo → Vault (contexte)

Pour que le **nombre de preuves scellées** et les agrégats Vault (hors o19 Business/Trésorerie) se remplissent :

- **Odoo o19** envoie les événements (factures, paiements, rapprochement) vers **DVIG** (connecteur + crons).
- **DVIG** transmet au **Vault** ; le Vault ingère et scelle les documents.
- **Linky** lit le Vault pour le badge « X preuves » et, pour o19, lit Odoo pour Trésorerie et Business afin d’afficher des **données à jour** même si le vaulting n’est pas encore complet.

En résumé : **stabiliser les données dans Linky** = configurer `ODOO_O19_URL` (et les URLs Odoo côté Vault), puis s’assurer que la chaîne Odoo → DVIG → Vault est opérationnelle pour les preuves. Linky affiche alors des données réelles synchronisées (Odoo pour les KPIs opérationnels, Vault pour les preuves).
