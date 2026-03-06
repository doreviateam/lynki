# Guide de recette manuelle — Phase DVIG (Complétude avant affichage)

**Référence :** SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1, RAPPORT_MOA_COMPLETUDE_AVANT_AFFICHAGE_2026-03-03  
**Objectif :** Valider que le flux Odoo → DVIG → Vault → Linky fonctionne correctement.

---

## Prérequis

- Odoo, DVIG, Vault, Linky démarrés
- Paramètres Odoo configurés (voir §2 ci-dessous)

---

## 1. Recette Phase DVIG — Flux nominal

### 1.1 Vérifier le CRON « Expected Counts Push »

1. Odoo → **Paramètres** → **Technique** → **Actions planifiées**
2. Rechercher **« Expected Counts Push (Phase DVIG) »**
3. Vérifier : **Actif** = ✓, **Intervalle** = 2 minutes
4. (Optionnel) Cliquer **Exécuter manuellement** → attendre 1 min
5. Vérifier les logs Odoo : aucune erreur `expected_counts_push_skip` ou `expected_counts_push_failed`

### 1.2 Vérifier l'affichage Linky

1. Ouvrir le cockpit Linky (connexion CFO ou admin)
2. Sélectionner un tenant/société/période avec des données
3. **Résultat attendu :**
   - « X / Y preuves scellées » (X = sealed, Y = expected_count)
   - « Dernière synchronisation : … » si `generated_at` fourni
   - Cartes visibles si complétude OK

### 1.3 Vérification Vault (optionnel)

```bash
# Snapshot complétude (remplacer tenant, dates)
curl -s "http://localhost:8080/ui/completeness-snapshot?tenant=core&date_debut=2026-01-01&date_fin=2026-01-31" | jq
```

**Attendu :** `expected_count`, `generated_at` présents si Phase DVIG alimentée.

---

## 2. Vérification configuration Odoo

Le CRON `push_expected_counts` nécessite les paramètres suivants :

| Paramètre | Obligatoire | Valeur exemple | Où configurer |
|-----------|-------------|----------------|---------------|
| `dorevia.dvig.url` | ✅ | `https://dvig.xxx.doreviateam.com` | Paramètres techniques → Paramètres système |
| `dorevia.dvig.internal.token` ou `dorevia.dvig.token` | ✅ | `dvig_xxx...` | Idem |
| `dorevia.tenant` ou `dorevia.vault.tenant` | ✅ | `core`, `sarl-la-platine`, etc. | Idem (ou dérivé de `dorevia.dvig.source`) |

**Contrôle rapide :** Si Y affiche « — » dans Linky, un de ces paramètres manque ou est incorrect.

---

## 3. Recette Vault indisponible / timeout

### 3.1 Arrêter le Vault

1. Arrêter le conteneur/service Vault
2. Recharger le cockpit Linky
3. **Résultat attendu :**
   - Écran « Synchronisation des preuves en cours… »
   - Aucune carte affichée
   - Pas de crash, pas d'erreur bloquante

### 3.2 Simuler timeout (optionnel)

- Si Vault répond > 5 s : Linky doit afficher SyncInProgress (timeout côté route dashboard-metrics)

---

## 4. Recette bouton Réessayer

1. Avec Vault arrêté (ou mock 503), ouvrir Linky
2. Attendre l'affichage « Synchronisation en cours… Vous pouvez réessayer »
3. Cliquer **Réessayer**
4. **Résultat attendu :** Nouvelle tentative de fetch ; si Vault toujours arrêté → reste sur SyncInProgress

---

## 5. Checklist récap

| # | Cas | Procédure | OK / KO |
|---|-----|-----------|---|
| 1 | CRON actif | Paramètres techniques → Actions planifiées | |
| 2 | Config Odoo | dorevia.dvig.url, token, tenant | |
| 3 | X/Y + Dernière sync | Linky affiche progression et date | |
| 4 | Vault arrêté | SyncInProgress, aucune carte | |
| 5 | Bouton Réessayer | Visible et fonctionnel après échec | |

---

*Guide recette Phase DVIG — Complétude avant affichage.*
