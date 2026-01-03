# ✅ Validation Reload SIGHUP - DVIG P1

**Date** : 2025-01-28  
**Environnement** : Local (port 8081)  
**Statut** : ✅ **Validation Réussie**

---

## 🎯 Objectif

Valider le reload immédiat des tokens via signal SIGHUP (sans attendre l'intervalle).

---

## ✅ Test Réalisé

### Scénario : Reload Immédiat via SIGHUP

**Actions** :
1. Service démarré avec token initial (`tok_lab_rehtse_odoo_01`)
2. Vérification token initial fonctionne
3. Ajout nouveau token (`tok_lab_rehtse_odoo_02`) dans `tokens.yml`
4. **Envoi SIGHUP au processus** (reload immédiat)
5. Vérification ancien token toujours accepté (overlap)
6. Vérification nouveau token accepté

**Résultat** : ✅ **Succès**

- ✅ SIGHUP reçu et traité
- ✅ Reload immédiat effectué
- ✅ Ancien token toujours accepté (201 Created)
- ✅ Nouveau token accepté (201 Created)
- ✅ Pas de downtime

---

## 🔍 Détails Techniques

### Configuration

```bash
export DVIG_TOKENS_RELOAD_ON_SIGHUP=1
export DVIG_TOKENS_RELOAD_INTERVAL=60  # Peut être > 0, SIGHUP prioritaire
```

### Commande SIGHUP

```bash
# Identifier le PID
DVIG_PID=$(pgrep -f "dvig.api_fastapi" | head -1)

# Envoyer SIGHUP
kill -HUP $DVIG_PID

# Ou depuis l'hôte Docker
docker kill --signal=HUP <container_id>
```

### Logs Attendus

```
INFO: SIGHUP reçu, reload immédiat
INFO: Tokens rechargés: 2 tokens chargés
```

---

## 📊 Comparaison Reload Intervalle vs SIGHUP

| Méthode | Délai | Usage |
|---------|-------|-------|
| **Intervalle** | 60s (configurable) | Reload périodique automatique |
| **SIGHUP** | Immédiat | Reload à la demande |

**Recommandation** : Utiliser les deux :
- Intervalle : Reload périodique (sécurité)
- SIGHUP : Reload immédiat après modification (flexibilité)

---

## ✅ Conclusion

**Validation SIGHUP : Réussie** ✅

Le reload SIGHUP fonctionne correctement :
- ✅ Handler enregistré au startup
- ✅ Signal reçu et traité
- ✅ Reload immédiat (sans attendre intervalle)
- ✅ Pas de downtime
- ✅ Tokens mis à jour instantanément
- ✅ Overlap fonctionne (ancien + nouveau tokens acceptés)

**Note** : 
- SIGHUP nécessite que le handler soit enregistré au startup (fait dans `app.py` via `@app.on_event("startup")`)
- SIGHUP fonctionne même si `DVIG_TOKENS_RELOAD_INTERVAL` est > 0 (SIGHUP prioritaire)
- Sur Windows, SIGHUP peut ne pas être disponible (gestion d'erreur prévue)

**Utilisation** :
```bash
# Identifier le PID
DVIG_PID=$(pgrep -f "dvig.api_fastapi" | head -1)

# Envoyer SIGHUP
kill -HUP $DVIG_PID

# Ou depuis Docker
docker kill --signal=HUP <container_id>
```

---

**Dernière mise à jour** : 2025-01-28

