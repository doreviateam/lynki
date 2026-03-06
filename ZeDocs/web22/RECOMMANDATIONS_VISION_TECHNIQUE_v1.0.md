# Recommandations — Vision Technique Dorevia Platform v1.0
## Renforcement architectural et préparation Phase DIVA

Date : 2026-02-16  
Auteur : Recommandations techniques structurantes  
Portée : Architecture, cohérence, évolutivité  

---

# 1. Objectif de ces recommandations

Ce document propose des améliorations ciblées afin de :

- Renforcer la cohérence entre Vision Produit et Vision Technique
- Sécuriser l’architecture avant implémentation DIVA
- Anticiper les questions d’un mentor technique / CTO
- Identifier les points critiques (snapshot, IA, registre DLP)

---

# 2. Ajouter une chaîne causale explicite

## Problème

La Vision Technique décrit parfaitement les flux. La Vision Produit décrit parfaitement la gouvernance.

Mais le pont entre les deux n’est pas encore explicitement matérialisé.

## Recommandation

Ajouter un schéma simple reliant preuve → lecture → intention → impact :

```
Vault (fait économique scellé)
    ↓
Agrégats Vault (/ui/aggregations/*)
    ↓
Résumé DIVA
    ↓
Avis humain
    ↓
DLP (marqueur d'intention)
    ↓
Impact observable futur sur indicateurs
```

---

# 3. Snapshot économique — Point critique

## Constat actuel

Les agrégats Vault sont dynamiques. Il n’existe pas encore de snapshot économique immuable.

Or : **La DLP doit être rattachée à un contexte figé.**

## Risque

Sans snapshot :

- Une DLP pourrait référencer un contexte évolutif
- La valeur probante serait affaiblie
- L’explication a posteriori deviendrait fragile

## Recommandation

Mettre en place un mécanisme de snapshot.

### Structure proposée

| Champ | Description |
|-------|-------------|
| `id` | Identifiant unique |
| `tenant` | Tenant |
| `created_at` | Date de création |
| `period_start` | Début période |
| `period_end` | Fin période |
| `data_hash` | Hash des données |
| `json_payload` | Données agrégées figées |
| `ledger_hash` | Référence ledger |

Les DLP référenceront `snapshot_id`.

---

# 4. Isolation stricte de DIVA

## Principe fondamental

- **Vault** = Preuve  
- **DIVA** = Cognition  
- **Linky** = Lecture  

Ces couches ne doivent jamais se mélanger.

## Recommandations

- DIVA n’a aucun accès direct à la base PostgreSQL Vault
- DIVA consomme uniquement les APIs publiques Vault
- DIVA n’écrit jamais dans Vault
- DLP stockées dans un registre distinct

---

# 5. Registre DLP — Architecture cible

## Modèle minimal recommandé

| Champ | Description |
|-------|-------------|
| `id` | Identifiant unique |
| `tenant` | Tenant |
| `snapshot_id` | Référence snapshot immuable |
| `created_at` | Date de création |
| `created_by` | Responsable |
| `enonce_long` | Version longue (registre probant) |
| `enonce_court` | Version courte (fil d'actualité) |
| `categorie_impact` | Coûts, revenus, organisation, fiscalité… |
| `status` | draft, validated, archived |
| `version` | Numéro de version |

**Important** :

- Pas de modification après validation
- Toute modification crée une nouvelle version
- Logique append-only

---

# 6. Clarification position IA (Mistral)

- **Utilisation** : synthèse, qualification, formalisation DLP
- **Aucun accès direct** à la base Vault
- **Aucun pouvoir d’écriture** sur données scellées
- **Aucune détention** de clés cryptographiques

---

# 7. Priorités techniques

| Priorité | Sujet | Impact |
|----------|-------|--------|
| Haute | Snapshot immuable | Cohérence probante DLP |
| Moyenne | Registre DLP dédié | Structuration gouvernance |
| Faible | Clarification doc IA | Lisibilité architecture |

---

# Conclusion

L’architecture actuelle est saine.

La Phase DIVA nécessite principalement :

- Un mécanisme de snapshot
- Un registre DLP structuré
- Une isolation stricte IA / preuve

Aucun changement fondamental d’architecture n’est requis.

La base technique est compatible avec la vision produit.

---

# Références (ZeDocs/web22)

| Document | Rôle |
|----------|------|
| `INDEX.md` | Index et navigation |
| `VISION_TECHNIQUE_DOREVIA_v1.0.md` | Vision technique |
| `DOREVIA_THE_BIG_PICTURE.md` | Vision produit |
| `SPEC_INSTALLATION_MISTRAL.v0.1.md` | Installation Mistral (vLLM) |
| `RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md` | Option B CPU (llama.cpp) |
| `RAPPORT_INTEGRATION_MISTRAL_DIVA_v1.0.md` | Rapport intégration Mistral/DIVA |
| `SPEC_DIVA_API_v1.0.md` | Spec API DIVA (v1.1, Flash) |

---

**Fin du document.**
