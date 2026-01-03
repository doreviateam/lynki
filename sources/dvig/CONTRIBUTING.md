# Guide de Contribution

Merci de votre intérêt pour contribuer à DVIG ! 🎉

## 📋 Processus de Contribution

### 1. Fork et Clone

```bash
# Fork le dépôt sur GitLab
# Puis clonez votre fork
git clone https://gitlab.example.com/votre-username/dorevia-vault-integration-gateway.git
cd dorevia-vault-integration-gateway
```

### 2. Créer une Branche

```bash
# Créer une branche pour votre fonctionnalité
git checkout -b feature/ma-fonctionnalite
```

### 3. Développement

- Suivez les conventions de code (voir ci-dessous)
- Ajoutez des tests pour votre code
- Assurez-vous que tous les tests passent
- Mettez à jour la documentation si nécessaire

### 4. Commit

Utilisez le format de commit standardisé :

```
type(scope): message

Exemples :
- feat(api): ajout endpoint /proofs
- fix(tenant): correction validation tenant-id
- docs(readme): mise à jour installation
- test(health): ajout tests unitaires
```

### 5. Push et Merge Request

```bash
# Push vers votre fork
git push origin feature/ma-fonctionnalite

# Ouvrir une Merge Request sur GitLab
```

## 🎨 Conventions de Code

### Python

- **Style** : PEP 8
- **Formatage** : Black
- **Linting** : Flake8
- **Type hints** : Utiliser les annotations de type

### Tests

- **Framework** : pytest
- **Couverture** : Minimum 80%
- **Structure** : Un test par fonctionnalité

### Documentation

- **Docstrings** : Format Google
- **README** : Mettre à jour si nécessaire
- **CHANGELOG** : Ajouter les changements

## ✅ Checklist avant Merge Request

- [ ] Code formaté avec Black
- [ ] Linting passé (Flake8)
- [ ] Tests unitaires passent
- [ ] Couverture de code > 80%
- [ ] Documentation mise à jour
- [ ] CHANGELOG mis à jour
- [ ] Commit messages formatés correctement

## 🐛 Signaler un Bug

Ouvrez une issue sur GitLab avec :
- Description du bug
- Étapes pour reproduire
- Comportement attendu vs réel
- Version de Python, OS, etc.

## 💡 Proposer une Fonctionnalité

Ouvrez une issue avec :
- Description de la fonctionnalité
- Cas d'usage
- Exemples si possible

---

Merci de contribuer à DVIG ! 🚀

