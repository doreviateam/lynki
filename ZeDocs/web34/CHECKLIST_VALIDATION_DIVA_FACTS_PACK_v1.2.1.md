# Checklist — Validation DIVA Facts Pack v1.2.1

**Date :** 28 février 2026  
**Objectif :** Valider et déployer la v1.2.1

---

## 1. Pré-déploiement (local)

| Étape | Commande / Action | Statut |
|-------|-------------------|--------|
| Compilation | `cd units/diva && go build ./cmd/diva ./cmd/diva-runner` | ✅ |
| Tests unitaires | `cd units/diva && go test ./...` | ✅ |
| Build image Docker | `cd units/diva && docker compose build` | ✅ |

---

## 2. Déploiement

| Étape | Action | Statut |
|-------|--------|--------|
| Rebuild image DIVA | `cd units/diva && docker compose build` | ✅ |
| Redémarrer DIVA | `cd units/diva && docker compose down && docker compose up -d` | ✅ |
| Vérifier health | `docker exec diva wget -qO- http://localhost:8010/health` | ✅ ok |

---

## 3. Validation E2E (manuel)

| Étape | Action | Statut |
|-------|--------|--------|
| Ouvrir cockpit | `https://ui.lab.laplatine2026.doreviateam.com` (ou tenant actif) | ☐ À faire |
| Vérifier synthèse | La synthèse DIVA s'affiche (headline, what_i_see, to_check) | ☐ À faire |
| Vérifier format | Pas de régression sur le format JSON (headline, what_i_see, to_check) | ☐ À faire |
| Logs métriques | `docker logs diva --tail 50` → `prompt_chars`, `llm_latency_ms` | ☐ À faire |

---

## 4. KPIs post-déploiement (24–48 h)

| KPI | Cible | Mesure |
|-----|-------|--------|
| Latence moyenne | −30 % | Comparer `llm_latency_ms` avant/après |
| Timeouts | < 2 % | Compter `event=diva_gen gen=degraded` vs total |
| Format réponse | Pas de régression | Vérifier headline non vide, structure OK |

---

## 5. Rollback (si nécessaire)

En cas de régression :

1. Revenir à l'image précédente : `dorevia/diva:cockpit-v1.1` (ou tag avant v1.2.1)
2. Redémarrer les conteneurs
3. Ouvrir un ticket pour investigation

---

*Référence : `ZeDocs/web34/RAPPORT_MOA_DIVA_FACTS_PACK_v1.2.1_2026-02-28.md`*
