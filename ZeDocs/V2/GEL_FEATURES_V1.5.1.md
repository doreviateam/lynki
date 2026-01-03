# 🔒 Gel des Features — v1.5.1-stable

**Date** : 2026-01-01  
**Tag** : `v1.5.1-stable`  
**Contexte** : Baseline après migration DNS P0.1 et corrections Caddyfile  
**Statut** : ✅ **Gel actif**

---

## 📋 Règle de Gel

**Aucune feature / refacto avant Sprint business**

### Scope du Gel

❌ **Interdit** :
- Nouvelles fonctionnalités
- Refactorisations
- Changements d'architecture
- Modifications de l'API publique
- Changements de format de configuration

✅ **Autorisé** :
- Corrections de bugs critiques (P0 uniquement)
- Corrections de sécurité
- Améliorations de documentation
- Corrections de typos
- Optimisations mineures (sans changement d'interface)

---

## 🎯 Justification

Cette baseline marque un point stable après :
- ✅ Complétion Phase 1 (66/66 points)
- ✅ Complétion Phase 2 (58/58 points)
- ✅ Corrections P0 appliquées et validées
- ✅ Migration DNS P0.1 complétée (2026-01-01)
- ✅ Tous les services opérationnels via HTTPS

**Objectif** : Stabiliser la plateforme avant le prochain sprint business.

---

## 📦 Snapshot

**Emplacement** : `backups/snapshots/<timestamp>_v1.5.1-stable/`

**Contenu** :
- Configs (Caddyfile)
- Manifests (tenants/*/state/manifest.json)
- Intents (tenants/*/state/intents/*.json)
- Logs (tenants/*/state/logs/*)

**Manifest** : `SNAPSHOT_MANIFEST.txt`

---

## 🔖 Tag Git

```bash
git tag -a v1.5.1-stable -m "Baseline stable après migration DNS P0.1"
```

**Commit de référence** : Voir `git log` pour le commit correspondant.

---

## ⚠️ Exception au Gel

Le gel peut être levé uniquement par :
- Décision explicite de l'équipe technique
- Validation du Product Owner
- Document de levée de gel (à créer)

**Processus de levée** :
1. Créer un document `LEVEE_GEL_V1.5.1.md`
2. Justifier la nécessité
3. Obtenir validation
4. Mettre à jour ce document

---

## 📚 Références

- **État des lieux** : `ZeDocs/V2/ETAT_DES_LIEUX_2025-12-31.md`
- **Rapport Corrections P0** : `ZeDocs/V2/RAPPORT_CORRECTIONS_P0.md`
- **Migration DNS** : `ZeDocs/V2/MIGRATION_DNS_P0.1.md`

---

**Document créé le** : 2026-01-01  
**Statut** : ✅ **Gel actif**  
**Prochaine révision** : Après Sprint business

