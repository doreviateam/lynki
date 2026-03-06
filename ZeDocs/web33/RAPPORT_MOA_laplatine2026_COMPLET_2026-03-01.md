# Rapport MOA — Tenant laplatine2026 : Bilan complet et contrainte DIVA

**Date :** 2026-03-01  
**Destinataire :** Maîtrise d'Ouvrage  
**Référence :** SPEC Multi-Tenant P0, rapport initial du 2026-02-28  
**Objet :** Bilan des réalisations pour le tenant laplatine2026, contrainte DIVA/Mistral et solutions proposées

---

## 1. Synthèse exécutive

Le tenant démo **laplatine2026** est **opérationnel**. Ce rapport fait le point sur :

1. **Les réalisations** — Vaulting, isolation multi-tenant, corrections globales
2. **La contrainte DIVA** — Dépendance à Mistral (IA locale) et timeouts occasionnels
3. **Les solutions proposées** — Court terme (optimisation) et moyen terme (choix IA)

| Indicateur | État |
|------------|------|
| **Tenant laplatine2026** | ✅ Opérationnel |
| **Vaulting factures / paiements** | ✅ 500 factures + 667 paiements vaultés |
| **Isolation multi-tenant** | ✅ Vérifiée (Odoo, Vault, Linky) |
| **Correction company_id NULL** | ✅ Appliquée globalement |
| **DIVA (analyse IA)** | ⚠️ Opérationnelle avec timeouts occasionnels |

---

## 2. Réalisations pour laplatine2026

### 2.1 Infrastructure et provisioning

| Élément | Détail |
|--------|--------|
| **Base Odoo** | `laplatine2026` — conteneur `odoo_db_lab_laplatine2026` |
| **Linky** | `linky_lab_laplatine2026` — `TENANT_ID=laplatine2026` |
| **DVIG** | Token dédié `tok_lab_laplatine2026_001` |
| **Vault** | Partagé — partition par `tenant` (documents.tenant = 'laplatine2026') |
| **URLs** | `ui.lab.laplatine2026.doreviateam.com`, `odoo.lab.laplatine2026.doreviateam.com` |

### 2.2 Vaulting des données

| Type | Total | Vaultés | Statut |
|------|-------|---------|--------|
| **Factures** (account.move) | 646 | 500 | 77 % vaultés ; 146 non initialisées (backfill possible) |
| **Paiements** (account.payment) | 667 | 667 | 100 % vaultés |

**Documents dans le Vault (tenant laplatine2026) :**
- 500 factures (account.move)
- 538 paiements (account.payment)
- **Total : 1038 documents** — aucun avec `company_id` NULL

### 2.3 Isolation multi-tenant

L'isolation a été vérifiée à chaque niveau :

| Niveau | Mécanisme | Vérification |
|--------|-----------|--------------|
| **Odoo** | Base dédiée `laplatine2026` | Aucune donnée sarl-la-platine |
| **DVIG** | Token tenant=laplatine2026 | Ingestion scopée au tenant |
| **Vault** | `WHERE tenant = 'laplatine2026'` | 1038 docs laplatine2026 / 175 sarl-la-platine |
| **Linky** | `TENANT_ID` + paramètre `tenant` dans toutes les requêtes | Agrégations filtrées par tenant |

**Conclusion :** Lors de la consultation de Linky pour laplatine2026, **aucune donnée de l'autre tenant n'est prise en compte**.

### 2.4 Corrections globales appliquées

| Correction | Portée | Description |
|------------|--------|-------------|
| **Migration 037 — company_id** | Vault (tous tenants) | Backfill des documents avec `company_id` NULL — extraction depuis payload (paiements) ou `odoo:1` (autres) |
| **Agrégations** | Vault | Suppression des filtres `OR company_id IS NULL` dans les requêtes |
| **Filtre période Linky** | Linky | Option « Toutes périodes (toutes années) » pour comparaison Linky/Odoo |

### 2.5 DIVA — Analyse IA du cockpit

**DIVA** (cockpit v1.1) produit des synthèses en langage naturel à partir des KPIs Linky (trésorerie, business, taxes, POS, etc.). Elle dépend de **Mistral** (llama.cpp, modèle Mistral 7B Q4 en local).

- **Statut actuel :** Opérationnelle — la majorité des requêtes aboutissent
- **Problème :** Timeouts occasionnels (voir section 3)

---

## 3. Contrainte DIVA — Dépendance à Mistral

### 3.1 Architecture actuelle

```
Linky (cockpit)  →  DIVA (API)  →  Mistral (llama.cpp, CPU)
                                        ↓
                                  Réponse JSON (headline, what_i_see, to_check)
```

- **Mistral** : serveur llama.cpp, modèle Mistral 7B Q4, inférence sur CPU
- **Configuration :** `--ctx-size 8192`, `--parallel 1`, `--threads 16`
- **Timeout DIVA :** 120 secondes par requête

### 3.2 Symptômes observés

| Symptôme | Fréquence | Cause |
|----------|-----------|-------|
| **mistral_timeout** | Occasionnel | Requête Mistral > 120 s |
| **mistral_http_400** (résolu) | — | Contexte dépassé (ctx-size 2048) — corrigé par passage à 8192 |
| Latence élevée | Fréquent | 60–120 s par analyse (CPU) |

### 3.3 Causes techniques

1. **Parallélisme limité** : `--parallel 1` — une seule requête à la fois. Le diva-runner envoie plusieurs requêtes (par société/tenant) ; les suivantes attendent en file.
2. **Inférence CPU** : Mistral 7B sur CPU ≈ 25–40 s (prompt) + 30–90 s (génération) selon la charge.
3. **Timeout 120 s** : Quand la file s'allonge, certaines requêtes dépassent ce délai.

### 3.4 Impact pour l'utilisateur

- **Cockpit Linky** : Les analyses DIVA s'affichent le plus souvent correctement.
- **Mode dégradé** : En cas de timeout, DIVA affiche une synthèse déterministe (insights pré-calculés) au lieu de la synthèse IA — pas de blocage, mais perte de la valeur ajoutée LLM.

---

## 4. Solutions proposées

### 4.1 Court terme — Optimisation de l'existant (recommandé)

| Action | Effort | Impact | Risque |
|--------|--------|--------|--------|
| **1. Augmenter le timeout DIVA** (120 s → 180 s) | Faible | Réduit les timeouts | Nul |
| **2. Augmenter le parallélisme Mistral** (`--parallel 2`) | Faible | Traite 2 requêtes simultanées | RAM : ~7 Go par instance (14 Go si parallel=2) |
| **3. Espacer le diva-runner** (`RUNNER_INTERVAL_SECONDS` 120 → 180) | Faible | Réduit la concurrence sur Mistral | Délai de rafraîchissement plus long |

**Recommandation :** Appliquer 1 et 2 si la RAM le permet (≈ 15 Go disponibles). Sinon, 1 et 3.

### 4.2 Moyen terme — Choix stratégique IA

Deux options ont été analysées :

#### Option A : Rester sur Mistral interne (recommandé pour les données sensibles)

| Avantage | Inconvénient |
|----------|--------------|
| Données financières restent en interne (RGPD, conformité) | Latence élevée, timeouts occasionnels |
| Pas de coût API, pas de dépendance externe | Qualité limitée (Mistral 7B Q4) |
| Maîtrise totale de l'infrastructure | Maintenance du serveur modèle |

**Adapté à :** Données sensibles (CA, trésorerie, POS, partenaires) — cas d'usage DIVA.

#### Option B : IA externe (OpenAI, Anthropic, Mistral API)

| Avantage | Inconvénient |
|----------|--------------|
| Rapidité, pas de timeouts | **Données envoyées hors périmètre** |
| Modèles plus puissants (GPT-4, Claude, Mistral Large) | RGPD, conformité, DPA requis |
| Pas d'infra à gérer | Coût par token, dépendance fournisseur |

**Adapté à :** Cas non sensibles ou avec DPA et consentement explicite.

#### Option C : Hybride

- **DIVA (analyses financières)** : Mistral interne — données sensibles
- **Autres usages** (FAQ, aide rédaction) : IA externe si besoin

### 4.3 Recommandation MOA

Pour le cockpit financier Dorevia et les analyses DIVA :

1. **Court terme** : Appliquer les optimisations (timeout, parallélisme ou espacement).
2. **Stratégie IA** : **Conserver Mistral interne** pour DIVA — les données agrégées (KPIs, montants, partenaires) restent sensibles et doivent rester en interne.
3. **Évolution** : Si la qualité ou la latence devient bloquante, évaluer une **inférence GPU locale** (ex. serveur avec GPU) avant d'envisager une IA externe.

---

## 5. Plan d'action proposé

| Priorité | Action | Responsable | Délai |
|----------|--------|-------------|-------|
| P1 | Augmenter timeout DIVA 120 s → 180 s | Technique | Immédiat |
| P1 | Augmenter `--parallel` Mistral à 2 (si RAM ≥ 15 Go) | Technique | Immédiat |
| P2 | Documenter la stratégie IA dans la SPEC | MOA / Technique | 1–2 semaines |
| P3 | Évaluer inférence GPU locale (si besoin qualité/performance) | Technique | Backlog |

---

## 6. Références

| Document | Chemin |
|----------|--------|
| Rapport initial MOA laplatine2026 | `ZeDocs/web33/RAPPORT_MOA_IMPLEMENTATION_MULTI-TENANT_laplatine2026.md` |
| SPEC Multi-Tenant | `ZeDocs/web33/SPEC_MULTI-TENANT.md` |
| Migration company_id | `sources/vault/migrations/037_backfill_company_id_null.sql` |
| Client Mistral DIVA | `units/diva/internal/mistral/client.go` |
| Docker Compose Mistral | `units/mistral/docker-compose.yml` |

---

## 7. Conclusion

Le tenant **laplatine2026** est pleinement opérationnel : vaulting des factures et paiements, isolation multi-tenant vérifiée, correction globale du `company_id`. La contrainte DIVA (timeouts Mistral) est **gérable** par des optimisations simples (timeout, parallélisme). La recommandation est de **conserver l'IA interne** pour les analyses financières et d'appliquer les correctifs court terme.

---

*Rapport généré le 2026-03-01.*
