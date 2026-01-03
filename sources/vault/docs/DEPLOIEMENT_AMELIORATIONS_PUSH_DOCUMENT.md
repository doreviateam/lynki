# 🚀 Déploiement des Améliorations - Handler `push_document`

**Date** : 2025-12-11  
**Version** : Améliorations post-investigation FAC/2025/00020

---

## ✅ Modifications à Déployer

### 1. Fichiers Modifiés

1. ✅ `internal/handlers/push_document.go`
   - Retry avec backoff exponentiel
   - Meilleure gestion d'erreur (distinction erreur critique vs non-critique)

2. ✅ `internal/storage/document_with_evidence.go`
   - Logs améliorés avec tenant et file_path
   - Vérification post-commit

3. ✅ `internal/handlers/diagnostic.go` (nouveau fichier)
   - Endpoint de diagnostic (nécessite enregistrement de la route)

---

## 📋 Checklist de Déploiement

### Phase 1 : Préparation

- [ ] Vérifier que tous les fichiers compilent correctement
- [ ] Exécuter les tests unitaires existants
- [ ] Vérifier que les modifications sont compatibles avec l'existant

### Phase 2 : Enregistrement de la Route (Optionnel)

Si vous souhaitez activer l'endpoint de diagnostic :

- [ ] Localiser le fichier qui enregistre les routes API (probablement dans un fichier de configuration ou un `main.go`)
- [ ] Ajouter la route : `api.Get("/diagnostic/document/:id", handlers.DiagnosticDocumentHandler(db))`
- [ ] Voir `docs/ENREGISTREMENT_ROUTE_DIAGNOSTIC.md` pour plus de détails

**Note** : L'endpoint de diagnostic est optionnel. Les améliorations principales (`push_document.go` et `document_with_evidence.go`) fonctionnent sans lui.

### Phase 3 : Build

```bash
# Compiler le projet
go build -o dorevia-vault ./cmd/server/main.go

# Ou utiliser le script de build existant
./scripts/build.sh
```

### Phase 4 : Tests Locaux (Recommandé)

- [ ] Tester le endpoint `push_document` avec un document de test
- [ ] Vérifier que les logs sont bien générés
- [ ] Tester le comportement en cas d'erreur

### Phase 5 : Déploiement

**Environnement de Test** :
- [ ] Déployer en environnement de test
- [ ] Vérifier que le service démarre correctement
- [ ] Tester avec des documents réels
- [ ] Vérifier les logs

**Production** :
- [ ] Déployer en production
- [ ] Surveiller les logs pendant les premières heures
- [ ] Vérifier que les métriques sont normales

---

## 🔍 Vérifications Post-Déploiement

### 1. Vérifier les Logs

Les nouveaux logs devraient apparaître :

```
Document transaction committed successfully
  document_id=...
  sha256=...
  tenant=...
  jws_generated=true
  ledger_appended=true
  file_path=...
```

### 2. Tester le Comportement Amélioré

**Test 1 : Vaultérisation normale**
```bash
curl -X POST "https://vault.doreviateam.com/api/v1/push_document" \
  -H "Content-Type: application/json" \
  -d '{"file": "...", "filename": "test.pdf"}'
```

**Test 2 : Vérifier les logs**
- Les logs devraient être plus détaillés
- La vérification post-commit devrait apparaître si nécessaire

### 3. Endpoint de Diagnostic (si activé)

```bash
curl -X GET "https://vault.doreviateam.com/api/v1/diagnostic/document/{vault_id}"
```

---

## ⚠️ Points d'Attention

### 1. Rétrocompatibilité

✅ **Les modifications sont rétrocompatibles** :
- Les réponses existantes sont préservées
- Pas de breaking changes
- Les clients existants continuent de fonctionner

### 2. Performance

- Le retry ajoute une latence maximale de ~300ms (3 tentatives avec backoff)
- Impact négligeable sur les performances normales
- Améliore la robustesse en cas de problème de timing

### 3. Logs

- Les nouveaux logs sont plus verbeux
- Vérifier que le système de logs peut gérer le volume supplémentaire
- Les logs d'erreur critique sont plus détaillés

---

## 🔄 Rollback (si nécessaire)

En cas de problème, le rollback est simple :

1. **Revenir à la version précédente** du code
2. **Redéployer** l'ancienne version
3. **Les données en base ne sont pas affectées** (pas de migration nécessaire)

---

## 📊 Impact Attendu

### Avantages Immédiats

1. ✅ **Robustesse** : Réduction du risque de retourner un `vault_id` pour un document inexistant
2. ✅ **Traçabilité** : Logs améliorés pour faciliter le diagnostic
3. ✅ **Résilience** : Gestion des problèmes de timing avec retry

### Cas d'Usage Résolus

- ✅ Document vaulté mais introuvable (cas FAC/2025/00020)
- ✅ Problèmes de timing/réplication
- ✅ Diagnostic facilité avec les logs améliorés

---

## 📝 Notes Techniques

### Retry Logic

- **Nombre de tentatives** : 3
- **Délai initial** : 100ms
- **Backoff** : Exponentiel (100ms, 200ms, 400ms)
- **Délai total max** : ~700ms

### Gestion d'Erreur

- **"document not found"** → Erreur critique (500) → Retry côté client recommandé
- **Autres erreurs** → Réponse partielle (201) → Vérification manuelle recommandée

---

## 🔗 Références

- **Document d'investigation** : `INVESTIGATION_DOCUMENT_FAC_00020.md`
- **Recommandations** : `docs/RECOMMANDATIONS_AMELIORATION_PUSH_DOCUMENT.md`
- **Résumé** : `docs/RESUME_AMELIORATIONS_PUSH_DOCUMENT.md`
- **Enregistrement route** : `docs/ENREGISTREMENT_ROUTE_DIAGNOSTIC.md`

---

**Fin du Document de Déploiement**
