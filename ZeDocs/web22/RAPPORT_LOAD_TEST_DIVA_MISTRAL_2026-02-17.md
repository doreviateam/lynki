# Rapport — Load test DIVA + Mistral

**Date** : 2026-02-17  
**Script** : `scripts/load_test_diva_mistral.sh`  
**Contexte** : Mistral-llamacpp + DIVA sur réseau `dorevia-network`  
**Références** : `RAPPORT_IMPLEMENTATION_DIVA_2026-02-17.md`, `SPEC_DIVA_API_v1.0.md`

---

## 1. Synthèse exécutive

| Métrique | Valeur | Commentaire |
|----------|--------|-------------|
| **RAM Mistral (avant charge)** | 3,56 GiB (22,8 %) | Stable, modèle chargé |
| **RAM Mistral (sous charge)** | 3,56 GiB (22,9 %) | Pas de fuite mémoire détectée |
| **CPU Mistral (sous charge)** | 140–182 % | Pic lors de 5 inférences parallèles |
| **Cache hit (latence)** | ~0,001–0,002 s | Excellent |
| **Force refresh (1 appel)** | 18–30 s | Dépend de la charge LLM |
| **Moyenne 10 simultanés** | 13,5 s | 5 cache + 5 force_refresh |
| **Moyenne 20 séquentiels** | ~0,001 s | Tous en cache |

---

## 2. Scénario de test

1. Mesure RAM/CPU Mistral avant toute charge  
2. Pré-remplissage du cache (1 appel pour chauffer)  
3. **10 appels simultanés** : 5 avec cache, 5 avec `force_refresh`  
4. Mesure RAM/CPU Mistral sous charge  
5. **20 appels séquentiels** (cache) pour calcul de la latence moyenne  
6. Log des moyennes dans `/tmp/diva_load_test.log`

---

## 3. Résultats détaillés

### 3.1 RAM/CPU Mistral

| Phase | CPU | RAM | RAM % |
|-------|-----|-----|-------|
| Avant charge | 0,00 % | 3,557 GiB / 15,57 GiB | 22,84 % |
| Sous charge (5 refresh parallèles) | 182,47 % | 3,558 GiB / 15,57 GiB | 22,85 % |

### 3.2 Premier appel (cold)

- **Latence** : 0,001 s (cache déjà rempli lors du run) ou ~17,8 s (cold run précédent)

### 3.3 10 appels simultanés (5 cache + 5 force_refresh)

| Type | Latences (s) |
|------|--------------|
| **Cache (5)** | 0,0028 • 0,0015 • 0,0014 • 0,0013 • 0,0022 |
| **Force refresh (5)** | 30,00 • 14,97 • 30,00 • 30,00 • 30,00 |

- Cache : réponse quasi instantanée  
- Refresh : inférences Mistral en parallèle, pic CPU à ~180 %

### 3.4 20 appels séquentiels (cache)

| N° | Latence | N° | Latence |
|----|---------|-----|---------|
| 1 | 0,0019 s | 11 | 0,0010 s |
| 2 | 0,0020 s | 12 | 0,0013 s |
| 3 | 0,0010 s | 13 | 0,0044 s |
| 4 | 0,0023 s | 14 | 0,0038 s |
| 5 | 0,0008 s | 15 | 0,0012 s |
| 6 | 0,0012 s | 16 | 0,0011 s |
| 7 | 0,0010 s | 17 | 0,0015 s |
| 8 | 0,0013 s | 18 | 0,0018 s |
| 9 | 0,0011 s | 19 | 0,0015 s |
| 10 | 0,0018 s | 20 | 0,0010 s |

**Moyenne** : ~0,001 s

---

## 4. Comportement cache vs force_refresh

| Mode | Latence typique | Comportement |
|------|-----------------|--------------|
| **Cache** | 0,001–0,004 s | Hash du contexte → hit mémoire, pas d’appel Mistral |
| **force_refresh** | 15–30 s | Bypass cache, requête Mistral systématique |

Le cache (`context_hash`, TTL 5 min) est efficace : les rappels sur le même contexte restent sous 5 ms.

---

## 5. Recommandations

1. **UX** : Debounce 5 s + bouton Rafraîchir — acceptable (cache = instantané, refresh = explicite).  
2. **Limiter les refresh** : Éviter de lancer plusieurs `force_refresh` en parallèle (charge CPU élevée).  
3. **Log** : La latence moyenne est journalisée dans `/tmp/diva_load_test.log` (ou `$LOG_FILE`).

---

## 6. Annexes

### 6.1 Commande pour relancer le test

```bash
scripts/load_test_diva_mistral.sh
# avec log personnalisé :
LOG_FILE=/chemin/vers/log.txt scripts/load_test_diva_mistral.sh
```

### 6.2 Fichiers générés

| Fichier | Contenu |
|---------|---------|
| `/tmp/load_test_diva_*.txt` | Rapport détaillé par run |
| `/tmp/diva_load_test.log` | Log cumulatif des moyennes (append) |
