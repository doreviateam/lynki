# Revue incohérences — PLAN_IMPLEMENTATION_DIVA_SCRUM_v1.0

**Date** : 2026-02-17

---

## 1. Terminologie Python dans un plan Go

| Section | Texte actuel | Correction |
|---------|--------------|------------|
| US-1.4 | "dict ou cache simple" | map ou cache en mémoire (Go) |
| US-1.4 | "Middleware ou décorateur logging" | Middleware logging (décorateur = Python) |

---

## 2. Paramètres Mistral (US-1.3)

Le plan cite uniquement : `temperature=0.2`, `max_tokens=256`, `timeout 30 s`.

L’**annexe §6** ajoute : `top_p: 0.9`, `frequency_penalty: 0`, `presence_penalty: 0`.

**Recommandation** : indiquer explicitement « paramètres selon annexe §6 » pour inclure top_p, etc.

---

## 3. Résolvabilité réseau DIVA

Linky et DIVA sont dans des **compose projets distincts** (tenants vs units). Sur `dorevia-network`, la résolution se fait par **container_name**, pas par nom de service.

**À préciser** : le service DIVA doit avoir `container_name: diva` (ou équivalent) pour que Linky puisse l’atteindre via `http://diva:8010`.

---

## 4. Variable d’environnement Linky

Le plan mentionne `DIVA_URL` côté proxy. Linky (conteneur) devra recevoir `DIVA_URL` dans son environnement (comme `VAULT_URL`, `DVIG_URL`).

**À documenter** : ajout de `DIVA_URL` dans le manifest / compose Linky (Sprint 2 ou 3).

---

## 5. Format meta.model

La SPEC §6 indique `"model": "mistral-7b-instruct-v0.2.Q4_K_M"`. Ce nom doit être fixe ou lu depuis la config Mistral.

**Cohérent** avec le modèle GGUF utilisé.

---

## 6. Précisions mineures

| Point | Statut |
|-------|--------|
| `treasury` → `treasury_validated_pct` | Aligné annexe §4 |
| Labels (IconGrid) | Trésorerie validée, Cash, etc. — cohérent |
| Chemin route Next.js | `app/api/diva/explain/route.ts` — conforme App Router |

---

**Fin du document.**
