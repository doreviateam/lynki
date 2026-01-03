# 📝 Note de Version - DVIG 0.1.2-auth

**Date** : 2025-01-28  
**Version** : `0.1.2-auth`  
**Environnement cible** : STINGER / PROD

---

## 🎯 Objectif

Mise à jour de la version DVIG de `0.1.1` à `0.1.2-auth` pour le déploiement STINGER/PROD.

---

## 📋 Changements

### Version Code

- **Avant** : `0.1.1`
- **Après** : `0.1.2`

### Fichiers Modifiés

1. `dvig/__init__.py` : `__version__ = "0.1.2"`
2. `dvig/api_fastapi/app.py` : `version="0.1.2"`
3. `dvig/api_fastapi/routes/health.py` : `"version": "0.1.2"`
4. `docker/Dockerfile` : `LABEL version="0.1.2"`

---

## 🏷️ Tag Docker

**Image Docker** : `dorevia/dvig:0.1.2-auth`

**Note** : Le suffixe `-auth` indique que cette version inclut les fonctionnalités P1 Auth/Token.

---

## ✅ Validation

```bash
# Vérifier version code
python -c "import dvig; print(dvig.__version__)"
# Devrait afficher : 0.1.2

# Vérifier version API
curl http://localhost:8080/health | jq .version
# Devrait afficher : "0.1.2"
```

---

## 🚀 Utilisation

### Build Image Docker

```bash
cd /opt/dorevia-plateform/sources/dvig
docker build -f docker/Dockerfile -t dorevia/dvig:0.1.2-auth .
```

### Tag Image (si registry)

```bash
docker tag dorevia/dvig:0.1.2-auth registry.doreviateam.com/dvig:0.1.2-auth
docker push registry.doreviateam.com/dvig:0.1.2-auth
```

---

## 📌 Notes

- Cette version est destinée à STINGER et PROD
- LAB peut continuer à utiliser `0.1.1` si nécessaire
- Le tag `-auth` est optionnel mais recommandé pour clarté

---

**Dernière mise à jour** : 2025-01-28

