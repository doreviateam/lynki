# 📘 Guide — Client Initiation Odoo STINGER (Sans DVIG/Vault)

**Version** : v1.0  
**Date** : 2026-01-12  
**Objectif** : Permettre à un client de s'initier à Odoo via `odoo.stinger.<tenant>.doreviateam.com` sans infrastructure DVIG/Vault

---

## 🎯 Objectif

Proposer à un client une instance Odoo STINGER complète et fonctionnelle pour qu'il puisse :
- ✅ Découvrir Odoo et ses fonctionnalités
- ✅ Tester les modules standard
- ✅ S'initier à l'interface et aux workflows
- ✅ Évaluer la solution avant engagement complet

**Sans nécessiter** :
- ❌ Infrastructure DVIG/Vault (vaulting de documents)
- ❌ Modules métier Dorevia (`dorevia_vault_connector`, `dorevia_billing_core`)
- ❌ Configuration complexe

---

## ✅ Faisabilité

**Réponse** : ✅ **OUI, c'est totalement possible** après implémentation de la SPEC `SPEC_DVIG_VAULT_OPTIONNELS_v1.0.md`

### Pourquoi c'est possible

1. **Odoo est indépendant** : Odoo peut fonctionner sans DVIG/Vault
   - Seule dépendance : Base de données PostgreSQL (incluse dans `docker-compose.yml` d'Odoo)
   - Aucune dépendance réseau vers DVIG/Vault au démarrage

2. **Routes Caddy indépendantes** : Les routes Odoo sont séparées des routes DVIG/Vault
   ```caddyfile
   # Route Odoo (toujours générée)
   odoo.stinger.<tenant>.doreviateam.com {
     reverse_proxy odoo_stinger_<tenant>:8069
   }
   
   # Routes DVIG/Vault (générées uniquement si services activés)
   dvig.<tenant>.doreviateam.com { ... }  # Optionnel
   vault.<tenant>.doreviateam.com { ... } # Optionnel
   ```

3. **Modules optionnels** : Les modules Dorevia (`dorevia_vault_connector`, `dorevia_billing_core`) sont optionnels
   - Ne pas les installer = Odoo fonctionne normalement
   - Odoo standard fonctionne sans ces modules

---

## 📋 Scénario Complet

### Étape 1 : Créer le Tenant

**Manifest** : `tenants/<tenant>/state/manifest.json`
```json
{
  "version": "1.0",
  "tenant_id": "client-demo",
  "created_at": "2026-01-12T00:00:00Z",
  "universes": ["odoo"],
  "environments": ["stinger"],
  "domain_mode": "saas",
  "units": {
    "platform": [],  // ✅ Vide = aucun service platform requis
    "odoo": ["odoo", "postgres"]
  },
  "images": {
    "odoo": "odoo:18.0-20250819",
    "postgres": "postgres:16"
  }
}
```

**Points clés** :
- ✅ `units.platform: []` → Aucun service DVIG/Vault requis
- ✅ `environments: ["stinger"]` → Environnement STINGER uniquement
- ✅ `universes: ["odoo"]` → Application Odoo

---

### Étape 2 : Configurer le Routage Gateway

**Fichier** : `units/gateway/Caddyfile`

**Ajouter** :
```caddyfile
# Tenant: client-demo - Environment: stinger

# odoo - Environnements (tenant client-demo)
odoo.stinger.client-demo.doreviateam.com {
  reverse_proxy odoo_stinger_client-demo:8069
}

# Services partagés (tenant client-demo)
# Note: Tenant sans platform (DVIG/Vault), routes non générées
```

**Points clés** :
- ✅ Route Odoo générée
- ✅ Pas de routes DVIG/Vault (services absents)

---

### Étape 3 : Créer l'Enregistrement DNS

**Chez le registrar** (OVH/Cloudflare/IONOS) :

**Enregistrement A** :
```
odoo.stinger.client-demo.doreviateam.com → IP_SERVEUR
```

**Points clés** :
- ✅ Un seul enregistrement DNS nécessaire (pas de `dvig.*` ni `vault.*`)

---

### Étape 4 : Démarrer Odoo

**Commande** :
```bash
dorevia.sh app up odoo stinger client-demo
```

**Comportement attendu** :
1. ✅ `check_platform_up()` lit le manifest
2. ✅ Détecte `units.platform: []` (vide)
3. ✅ Retourne success sans vérification
4. ✅ Odoo démarre normalement avec sa base PostgreSQL

**Résultat** :
- ✅ Container `odoo_stinger_client-demo` démarré
- ✅ Container `odoo_db_stinger_client-demo` démarré
- ✅ Aucun container DVIG/Vault

---

### Étape 5 : Accéder à Odoo

**URL** : `https://odoo.stinger.client-demo.doreviateam.com`

**Premier accès** :
1. Odoo affiche l'assistant de configuration
2. Créer la base de données initiale
3. Configurer l'utilisateur admin
4. Accéder à l'interface Odoo standard

**Fonctionnalités disponibles** :
- ✅ Tous les modules Odoo standard
- ✅ Gestion des contacts, produits, commandes
- ✅ Comptabilité, facturation
- ✅ CRM, ventes, achats
- ✅ **Sans** fonctionnalités de vaulting Dorevia

---

## ⚠️ Limitations (Attendues)

### Fonctionnalités Non Disponibles

1. **Vaulting de factures** :
   - ❌ Module `dorevia_vault_connector` non installé
   - ❌ Pas de stockage sécurisé des documents dans Vault
   - ✅ Factures Odoo standard fonctionnent normalement

2. **Billing automatique** :
   - ❌ Module `dorevia_billing_core` non installé
   - ❌ Pas de réception automatique de constats depuis Vault
   - ✅ Facturation manuelle Odoo standard fonctionne

3. **Intégration DVIG** :
   - ❌ Pas d'API DVIG disponible
   - ❌ Pas de tokens DVIG générés
   - ✅ Odoo fonctionne en mode standalone

---

## 🔄 Migration Ultérieure (Si Besoin)

### Scénario : Client veut ajouter DVIG/Vault plus tard

**Étapes** :
1. Modifier manifest : `units.platform: ["dvig", "vault", "postgres"]`
2. Générer tokens DVIG : `dorevia.sh token issue odoo stinger client-demo`
3. Démarrer platform : `dorevia.sh platform up client-demo`
4. Ajouter routes Caddy/DNS pour DVIG/Vault
5. Installer modules Odoo si nécessaire : `dorevia_vault_connector`, `dorevia_billing_core`

**Résultat** :
- ✅ Services platform ajoutés sans impact sur Odoo existant
- ✅ Migration transparente

---

## 📊 Comparaison : Avec vs Sans DVIG/Vault

| Aspect | Sans DVIG/Vault | Avec DVIG/Vault |
|--------|----------------|-----------------|
| **Démarrage Odoo** | ✅ Immédiat | ✅ Immédiat |
| **Fonctionnalités Odoo standard** | ✅ Complètes | ✅ Complètes |
| **Vaulting de factures** | ❌ Non disponible | ✅ Disponible |
| **Billing automatique** | ❌ Non disponible | ✅ Disponible |
| **Infrastructure requise** | 🟢 Minimale (Odoo + DB) | 🟡 Complète (Odoo + DB + DVIG + Vault) |
| **Coûts ressources** | 🟢 Faibles | 🟡 Moyens |
| **Complexité** | 🟢 Simple | 🟡 Moyenne |

---

## ✅ Checklist de Déploiement

### Prérequis
- [ ] SPEC `SPEC_DVIG_VAULT_OPTIONNELS_v1.0.md` implémentée
- [ ] Gateway (Caddy) opérationnelle
- [ ] Docker + Docker Compose fonctionnels

### Création Tenant
- [ ] Manifest créé avec `units.platform: []`
- [ ] Structure `tenants/<tenant>/` créée
- [ ] Route Odoo ajoutée dans Caddyfile
- [ ] Enregistrement DNS créé

### Démarrage
- [ ] `dorevia.sh app up odoo stinger <tenant>` exécuté
- [ ] Containers Odoo démarrés
- [ ] URL `https://odoo.stinger.<tenant>.doreviateam.com` accessible
- [ ] Base de données Odoo initialisée

### Validation
- [ ] Interface Odoo accessible
- [ ] Modules standard fonctionnels
- [ ] Aucune erreur dans les logs
- [ ] Pas de dépendance vers DVIG/Vault

---

## 🎯 Cas d'Usage Recommandés

### ✅ Idéal pour

1. **Démonstration client** :
   - Présentation des fonctionnalités Odoo
   - Formation initiale
   - Évaluation de la solution

2. **Environnement de test** :
   - Tests de modules Odoo standard
   - Développement de workflows
   - Formation équipe

3. **Migration progressive** :
   - Première phase : Initiation Odoo
   - Deuxième phase : Ajout DVIG/Vault si besoin

### ❌ Non recommandé pour

1. **Production avec vaulting** :
   - Si le client a besoin de vaulting de factures
   - Si le client a besoin de billing automatique

2. **Conformité réglementaire** :
   - Si le vaulting est obligatoire (ex: factures électroniques)

---

## 📝 Conclusion

**Réponse à la question** : ✅ **OUI, c'est totalement possible**

Après implémentation de la SPEC `SPEC_DVIG_VAULT_OPTIONNELS_v1.0.md`, il sera possible de :

1. ✅ Créer un tenant avec `units.platform: []`
2. ✅ Démarrer Odoo STINGER sans DVIG/Vault
3. ✅ Proposer `odoo.stinger.<tenant>.doreviateam.com` au client
4. ✅ Offrir une expérience Odoo complète (sans fonctionnalités Dorevia)
5. ✅ Ajouter DVIG/Vault ultérieurement si besoin

**Avantages** :
- 🟢 Démarrage rapide et simple
- 🟢 Coûts réduits (moins de ressources)
- 🟢 Complexité minimale
- 🟢 Évolutif (ajout de services possible)

---

**Références** :
- `SPEC_DVIG_VAULT_OPTIONNELS_v1.0.md` : Spécification technique
- `EVALUATION_DVIG_VAULT_OPTIONNELS.md` : Analyse d'impact
- `docs/GUIDE_CREATION_TENANT.md` : Guide de création de tenant
