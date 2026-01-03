# 🔐 Tokens STINGER Générés - DVIG P1 Auth/Token

**Date** : 2025-01-28  
**Environnement** : STINGER  
**Statut** : ✅ Générés

---

## ⚠️ SÉCURITÉ IMPORTANTE

**⚠️ NE JAMAIS COMMITER CE FICHIER AVEC TOKENS RÉELS**

- ✅ Token brut stocké hors Git (fichier local protégé)
- ✅ Seulement `token_id` + `token_hash` dans ce document
- ✅ Token brut à révoquer après tests si divulgué

---

## 📋 Informations Tokens

### Token STINGER #1

- **Token ID** : `tok_stinger_odoo_01`
- **Token Hash** : `sha256:10f2b639ecf0e96df50adf3ec3358a0a815214396051e2eb87a4403889081340`
- **Tenant** : `stinger`
- **Univers** : `odoo`
- **Status** : `active`
- **Créé le** : 2025-01-28

### Token Brut

**⚠️ Token brut stocké localement** (hors Git) :
- Fichier : `/opt/dorevia-plateform/sources/dvig/conf/token_stinger_brut.txt`
- Permissions : `600` (lecture/écriture propriétaire uniquement)
- **À supprimer après déploiement STINGER validé**

---

## 📁 Fichiers

### Fichier Local (Préparation)

**Fichier** : `/opt/dorevia-plateform/sources/dvig/conf/tokens.stinger.yml`

**Contenu** :
```yaml
version: 1
tokens:
  - id: "tok_stinger_odoo_01"
    token_hash: "sha256:..."
    tenant: "stinger"
    univers: "odoo"
    status: "active"
    created_at: "2025-01-28T00:00:00Z"
    comment: "STINGER - Token initial"
```

**⚠️ Ce fichier ne doit PAS être commité dans Git.**

### Fichier Serveur STINGER (Déploiement)

**Fichier** : `/etc/dvig/tokens.yml`

**Permissions** :
```bash
chmod 0400 /etc/dvig/tokens.yml
chown root:root /etc/dvig/tokens.yml
```

---

## 🚀 Utilisation

### 1. Copier sur Serveur STINGER

```bash
# Depuis machine locale
scp /opt/dorevia-plateform/sources/dvig/conf/tokens.stinger.yml user@stinger:/etc/dvig/tokens.yml

# Sur serveur STINGER
sudo chmod 0400 /etc/dvig/tokens.yml
sudo chown root:root /etc/dvig/tokens.yml
```

### 2. Vérifier Token

```bash
# Charger token brut (depuis fichier local protégé)
source /opt/dorevia-plateform/sources/dvig/conf/token_stinger_brut.txt

# Tester token
curl -X POST http://stinger.doreviateam.com:8080/ingest \
  -H "Authorization: Bearer $TOKEN_BRUT" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.stinger","source":"odoo.stinger.core","data":{}}'
```

**Note** : Le token brut est disponible dans `/opt/dorevia-plateform/sources/dvig/conf/token_stinger_brut.txt` (fichier local, non commité).

---

## 🔐 Hygiène Sécurité

### Après Validation STINGER

- [ ] Révoquer tokens de test si divulgués
- [ ] Ne garder en actif que tokens STINGER requis
- [ ] Vérifier qu'aucun token brut n'est dans Git
- [ ] Nettoyer fichiers temporaires avec tokens bruts

---

## 📝 Notes

- Token brut stocké localement (hors Git)
- Hash disponible dans `tokens.stinger.yml` (local, non commité)
- Fichier serveur : `/etc/dvig/tokens.yml` (permissions `0400`)

---

**Dernière mise à jour** : 2025-01-28

