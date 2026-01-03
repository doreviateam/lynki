# 📋 Résumé Rapide - Déploiement Corrections Sécurité

**Date** : Janvier 2025  
**Version** : v1.5.3+  
**Temps estimé** : 5-10 minutes

---

## 🚀 Déploiement en 3 Étapes

### 1. Exécuter le Script de Déploiement

```bash
cd /opt/dorevia-vault
sudo ./scripts/deploy_security_fixes.sh
```

Le script fait automatiquement :
- ✅ Vérification des prérequis
- ✅ Exécution des tests
- ✅ Compilation du binaire
- ✅ Sauvegarde de l'ancien binaire
- ✅ Redémarrage du service
- ✅ Vérification du déploiement

### 2. Vérifier le Déploiement

```bash
# Vérifier la version
curl http://localhost:8080/version

# Vérifier le health
curl http://localhost:8080/health

# Vérifier les logs
sudo journalctl -u dorevia-vault -n 50
```

### 3. (Optionnel) Configurer les Variables

Si vous souhaitez personnaliser les limites, ajoutez dans `/etc/systemd/system/dorevia-vault.service` :

```bash
Environment="MAX_UPLOAD_SIZE_BYTES=10485760"
Environment="RATE_LIMIT_MAX_REQUESTS=100"
Environment="CORS_ALLOWED_ORIGINS=https://vault.doreviateam.com"
```

Puis redémarrer :
```bash
sudo systemctl daemon-reload
sudo systemctl restart dorevia-vault
```

---

## ✅ Checklist

- [ ] Script exécuté avec succès
- [ ] Service redémarré
- [ ] Version vérifiée
- [ ] Health check OK
- [ ] Logs sans erreurs

---

## 🆘 En Cas de Problème

### Rollback

```bash
# Restaurer l'ancien binaire
sudo cp /opt/dorevia-vault/bin/vault.backup.* /opt/dorevia-vault/bin/vault
sudo systemctl restart dorevia-vault
```

### Vérifier les Logs

```bash
sudo journalctl -u dorevia-vault -n 100 -f
```

---

**Documentation complète** : `docs/PLAN_REDEPLOIEMENT_SECURITE.md`

