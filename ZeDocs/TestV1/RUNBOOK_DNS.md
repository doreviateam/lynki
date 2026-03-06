# 🌐 Runbook DNS — Gestion Domaines Phase 3

**Version** : 1.0  
**Date** : 2026-01-02  
**Phase** : Phase 3 "Domaines & Serveurs Clients"

---

## Vue d'Ensemble

Ce document décrit la gestion DNS pour la plateforme Dorevia en Phase 3, incluant les modes de gestion DNS (Mode 1 vs Mode 2) et les processus de validation.

---

## 1. Modes de Gestion DNS

### Mode 1 : Doreviateam gère le DNS (Recommandé)

**Responsabilité** : Doreviateam gère la zone DNS complète.

**Avantages** :
- Continuité de service garantie (renouvellement automatique)
- Monitoring DNS intégré
- Réactivité rapide en cas de problème
- Cohérence avec l'infrastructure Doreviateam

**Processus** :
1. Client délègue la zone DNS à Doreviateam (NS records)
2. Doreviateam crée/gère tous les enregistrements DNS
3. Doreviateam assure le monitoring et le renouvellement

**Enregistrements DNS à créer** :
- A records pour tous les hostnames (canonique, fallback, alias)
- Tous les hostnames pointent vers l'IP du serveur cible

---

### Mode 2 : Client gère le DNS

**Responsabilité** : Le client gère sa propre zone DNS.

**Avantages** :
- Contrôle total pour le client
- Intégration avec infrastructure DNS existante

**Inconvénients** :
- Dépendance à la réactivité du client
- Risque de non-renouvellement
- Coordination nécessaire pour changements

**Processus** :
1. Doreviateam fournit une checklist d'enregistrements DNS
2. Client crée les enregistrements dans sa zone DNS
3. Doreviateam valide la configuration DNS

**Checklist enregistrements DNS** :
Voir section 3.

---

## 2. Types de Hostnames

### 2.1 Hostnames Canoniques

Format : `<univers>.<env>.<tenant>.<canonical_domain>`

Exemples :
- `odoo.prod.rozas.rozas.gp`
- `dvig.rozas.rozas.gp`
- `vault.rozas.rozas.gp`

**Règle** : Chaque service a un hostname canonique unique.

---

### 2.2 Hostnames Fallback

Format : `<univers>.<env>.<tenant>.doreviateam.com`

Exemples :
- `odoo.prod.rozas.doreviateam.com`
- `dvig.rozas.doreviateam.com`
- `vault.rozas.doreviateam.com`

**Règle** : Le fallback est obligatoire en mode Client/Hybrid pour garantir la continuité de service.

---

### 2.3 Hostnames Alias

**Alias Global** : Applicable à tous les services
- Exemple : `api.client.com` → tous les services (odoo, dvig, vault)

**Alias par Service** : Applicable à un service spécifique
- Exemple : `erp.client.com` → uniquement odoo
- Exemple : `auth.client.com` → uniquement dvig

**Règle** : Les alias doivent être différents des hostnames canoniques et fallback.

---

## 3. Checklist Enregistrements DNS (Mode 2)

### 3.1 Enregistrements A (Canoniques)

Pour chaque univers activé :
```
odoo.prod.<tenant>.<canonical_domain>  A  <IP_SERVEUR>
```

Pour les services cœur (DVIG/Vault) :
```
dvig.<tenant>.<canonical_domain>  A  <IP_SERVEUR>
vault.<tenant>.<canonical_domain>  A  <IP_SERVEUR>
```

### 3.2 Enregistrements A (Fallback)

Pour chaque univers activé :
```
odoo.prod.<tenant>.doreviateam.com  A  <IP_SERVEUR>
```

Pour les services cœur :
```
dvig.<tenant>.doreviateam.com  A  <IP_SERVEUR>
vault.<tenant>.doreviateam.com  A  <IP_SERVEUR>
```

### 3.3 Enregistrements A (Alias)

Pour chaque alias configuré :
```
<alias_hostname>  A  <IP_SERVEUR>
```

**Important** : Tous les alias doivent pointer vers la même IP que les hostnames canoniques.

---

## 4. Processus de Validation DNS

### 4.1 Validation Automatique

Utiliser la commande `preflight --check-dns` :

```bash
# Validation depuis manifest
dorevia.sh preflight <tenant> --env <env> --check-dns

# Validation depuis intention
dorevia.sh preflight <tenant> --env <env> --check-dns --intent <intent_file>
```

**Vérifications effectuées** :
- Résolution DNS pour tous les hostnames (canonique, fallback, alias)
- Cohérence IP (tous les hostnames doivent résoudre vers la même IP)
- Rapport lisible avec statut par hostname

### 4.2 Validation Manuelle

**Vérifier résolution DNS** :
```bash
dig +short <hostname>
nslookup <hostname>
```

**Vérifier cohérence IP** :
```bash
# Tous les hostnames doivent résoudre vers la même IP
for hostname in <hostname1> <hostname2> <hostname3>; do
  echo "$hostname: $(dig +short $hostname)"
done
```

---

## 5. Gestion des Erreurs DNS

### 5.1 Hostname Non Résolu

**Symptôme** : `dig +short <hostname>` retourne vide.

**Actions** :
1. Vérifier que l'enregistrement A existe dans la zone DNS
2. Vérifier la propagation DNS (TTL, délai)
3. Vérifier les permissions de la zone DNS

### 5.2 IP Incohérente

**Symptôme** : Les hostnames résolvent vers des IP différentes.

**Actions** :
1. Vérifier que tous les enregistrements A pointent vers la même IP
2. Vérifier qu'il n'y a pas de CNAME en conflit
3. Vérifier la cohérence avec l'IP du serveur cible

### 5.3 Alias Non Résolu

**Symptôme** : Un alias ne résout pas.

**Actions** :
1. Vérifier que l'alias est bien configuré dans `manifest.json` ou `intent.json`
2. Vérifier que l'enregistrement A existe pour l'alias
3. Vérifier la propagation DNS

---

## 6. Processus de Mise à Jour DNS

### 6.1 Ajout d'un Alias

1. Configurer l'alias dans `manifest.json` ou via `prompt`
2. Créer l'enregistrement A dans la zone DNS
3. Valider avec `preflight --check-dns`
4. Régénérer le Caddyfile si nécessaire

### 6.2 Changement d'IP Serveur

1. Mettre à jour l'IP dans `manifest.json` ou `servers/<server_name>.json`
2. Mettre à jour tous les enregistrements A dans la zone DNS
3. Valider avec `preflight --check-dns`
4. Vérifier la propagation DNS (TTL)

---

## 7. Recommandations

### 7.1 TTL (Time To Live)

**Recommandation** : TTL de 300 secondes (5 minutes) pour les enregistrements A.

**Raison** : Équilibre entre réactivité aux changements et performance DNS.

### 7.2 Monitoring DNS

**Recommandation** : Monitorer la résolution DNS pour tous les hostnames critiques.

**Outils** :
- Monitoring externe (UptimeRobot, Pingdom)
- Scripts de vérification périodique

### 7.3 Documentation

**Recommandation** : Documenter tous les enregistrements DNS dans un fichier de référence.

**Format** : Liste des hostnames avec leur type (canonique, fallback, alias) et leur IP.

---

## 8. Exemples

### 8.1 Configuration Complète (Mode Client)

**Tenant** : `rozas`  
**Domaine canonique** : `rozas.gp`  
**IP serveur** : `192.0.2.100`

**Enregistrements DNS** :
```
odoo.prod.rozas.rozas.gp          A  192.0.2.100
odoo.prod.rozas.doreviateam.com   A  192.0.2.100
dvig.rozas.rozas.gp               A  192.0.2.100
dvig.rozas.doreviateam.com        A  192.0.2.100
vault.rozas.rozas.gp              A  192.0.2.100
vault.rozas.doreviateam.com       A  192.0.2.100
erp.rozas.gp                      A  192.0.2.100  (alias odoo)
api.rozas.gp                      A  192.0.2.100  (alias global)
```

### 8.2 Validation

```bash
# Validation automatique
dorevia.sh preflight rozas --env prod --check-dns

# Résultat attendu :
# ✅ odoo.prod.rozas.rozas.gp: Résout vers 192.0.2.100
# ✅ odoo.prod.rozas.doreviateam.com: Résout vers 192.0.2.100
# ✅ dvig.rozas.rozas.gp: Résout vers 192.0.2.100
# ✅ erp.rozas.gp: Résout vers 192.0.2.100
# ✅ api.rozas.gp: Résout vers 192.0.2.100
```

---

**Dernière mise à jour** : 2026-01-02

