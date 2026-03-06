# 📚 Tutoriel Utilisateur — Plateforme Dorevia

**Version** : 1.0  
**Date** : 2026-01-02  
**Audience** : Utilisateurs non informaticiens  
**Objectif** : Apprendre à utiliser la plateforme Dorevia simplement

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Concepts de Base](#concepts-de-base)
3. [Premiers Pas](#premiers-pas)
4. [Opérations Courantes](#opérations-courantes)
5. [Cas d'Usage Pratiques](#cas-dusage-pratiques)
6. [FAQ](#faq)
7. [Besoin d'Aide ?](#besoin-daide)

---

## Introduction

### Qu'est-ce que la Plateforme Dorevia ?

La **Plateforme Dorevia** est un outil qui permet de **gérer et déployer vos applications** (comme Odoo) de manière simple et sécurisée.

**En termes simples** : C'est comme un "tableau de bord" qui vous permet de :
- ✅ Configurer vos applications
- ✅ Les mettre en ligne (déployer)
- ✅ Gérer vos domaines (adresses web)
- ✅ Sauvegarder vos données

**Vous n'avez pas besoin d'être informaticien** pour l'utiliser ! Ce tutoriel vous guide pas à pas.

---

## Concepts de Base

### 1. Tenant (Client)

Un **tenant** représente votre entreprise ou organisation dans la plateforme.

**Exemple** : Si vous êtes "SARL La Platine", votre tenant pourrait être `laplatine`.

**En pratique** : Chaque tenant a ses propres applications, données et configurations.

---

### 2. Environnement

Un **environnement** est un "espace" où votre application peut fonctionner.

Il y a **3 environnements** :

| Environnement | À quoi ça sert ? | Quand l'utiliser ? |
|---------------|------------------|-------------------|
| **lab** | Tests et expérimentations | Pour tester de nouvelles fonctionnalités |
| **stinger** | Pré-production | Pour valider avant la mise en production |
| **prod** | Production (réel) | Pour vos utilisateurs finaux |

**Analogie** : C'est comme avoir 3 bureaux :
- Un bureau de test (lab)
- Un bureau de validation (stinger)
- Votre vrai bureau (prod)

---

### 3. Univers

Un **univers** est une application que vous utilisez.

**Exemple** : `odoo` est un univers (votre logiciel de gestion).

**En pratique** : Vous pouvez avoir plusieurs univers (odoo, pos, etc.) pour un même tenant.

---

### 4. Domaine

Un **domaine** est l'adresse web de votre application.

**Exemple** : `odoo.prod.laplatine.doreviateam.com`

**En pratique** : C'est l'URL que vos utilisateurs tapent dans leur navigateur pour accéder à votre application.

---

## Premiers Pas

### Étape 1 : Vérifier que tout est prêt

Avant de commencer, vérifiez que la plateforme est installée :

```bash
dorevia.sh doctor
```

**Que fait cette commande ?**  
Elle vérifie que tous les outils nécessaires sont installés (Docker, etc.).

**Résultat attendu** : ✅ Tout est OK

---

### Étape 2 : Voir l'aide

Pour voir toutes les commandes disponibles :

```bash
dorevia.sh help
```

**Que fait cette commande ?**  
Elle affiche la liste de toutes les commandes disponibles avec leur description.

---

### Étape 3 : Voir les tenants disponibles

Pour voir quels tenants (clients) sont configurés :

```bash
dorevia.sh validate <tenant>
```

**Exemple** :
```bash
dorevia.sh validate laplatine
```

**Que fait cette commande ?**  
Elle vérifie que la configuration du tenant est correcte.

**Résultat attendu** : ✅ Manifest valide

---

## Opérations Courantes

### 🔧 Configurer un Déploiement (Mode Interactif)

**Quand l'utiliser ?**  
Quand vous voulez déployer une application pour la première fois ou modifier sa configuration.

**Comment faire ?**

```bash
dorevia.sh prompt <tenant> --env <environnement>
```

**Exemple** :
```bash
dorevia.sh prompt laplatine --env prod
```

**Que se passe-t-il ?**

1. La plateforme vous pose des questions simples :
   - Quels univers activer ? (ex: odoo)
   - Quel mode de production ? (SaaS, Client, Hybride)
   - Quel domaine utiliser ? (votre domaine ou celui par défaut)
   - Voulez-vous des alias ? (adresses web supplémentaires)

2. Vous répondez aux questions

3. La plateforme génère un fichier de configuration

**Résultat** : Un fichier `intent-*.json` est créé avec votre configuration.

---

### 🎨 Générer les Fichiers de Configuration

**Quand l'utiliser ?**  
Après avoir configuré votre déploiement (via `prompt`) ou modifié le manifest.

**Comment faire ?**

```bash
dorevia.sh render <tenant> --env <environnement>
```

**Exemple** :
```bash
dorevia.sh render laplatine --env prod
```

**Que fait cette commande ?**  
Elle génère tous les fichiers nécessaires pour le déploiement :
- Configuration du serveur web (Caddyfile)
- Configuration Docker (docker-compose.yml)

**Résultat** : Les fichiers sont générés dans `tenants/<tenant>/rendered/<env>/`

---

### ✅ Vérifier avant Déploiement

**Quand l'utiliser ?**  
Avant de déployer, pour s'assurer que tout est prêt.

**Comment faire ?**

```bash
dorevia.sh preflight <tenant> --env <environnement>
```

**Exemple** :
```bash
dorevia.sh preflight laplatine --env prod
```

**Que fait cette commande ?**  
Elle vérifie :
- ✅ Que Docker est installé
- ✅ Que les ports nécessaires sont libres
- ✅ Que les fichiers de configuration sont présents
- ✅ (Optionnel) Que les DNS sont configurés correctement

**Résultat** : Un rapport indiquant si tout est OK ou s'il y a des problèmes.

---

### 🚀 Déployer une Application

**Quand l'utiliser ?**  
Quand vous voulez mettre en ligne votre application.

**Comment faire ?**

**Option 1 : Depuis un fichier de configuration (recommandé)**
```bash
dorevia.sh apply <tenant> --intent <fichier_intent>
```

**Exemple** :
```bash
dorevia.sh apply laplatine --intent tenants/laplatine/state/intents/intent-20260102T120000Z.json
```

**Option 2 : Depuis les fichiers générés**
```bash
dorevia.sh apply <tenant> --env <environnement>
```

**Exemple** :
```bash
dorevia.sh apply laplatine --env prod
```

**Que fait cette commande ?**  
Elle :
1. Lit votre configuration
2. Démarre les services nécessaires (base de données, application, etc.)
3. Configure le serveur web
4. Rend votre application accessible

**Résultat** : Votre application est en ligne et accessible via son URL.

---

### 🌐 Gérer le Serveur Web (Gateway)

**Quand l'utiliser ?**  
Pour mettre à jour la configuration du serveur web après avoir ajouté/modifié des domaines.

**Comment faire ?**

```bash
dorevia.sh gateway aggregate --reload
```

**Que fait cette commande ?**  
Elle :
1. Rassemble toutes les configurations de tous les tenants
2. Génère un fichier de configuration global
3. Recharge le serveur web (Caddy)

**Résultat** : Tous les domaines sont à jour et accessibles.

---

### 📊 Voir le Statut

**Quand l'utiliser ?**  
Pour vérifier si vos services fonctionnent.

**Comment faire ?**

**Voir le statut de la gateway (serveur web)** :
```bash
dorevia.sh gateway status
```

**Voir le statut de la plateforme (services partagés)** :
```bash
dorevia.sh platform status <tenant>
```

**Voir le statut d'une application** :
```bash
dorevia.sh app status <univers> <env> <tenant>
```

**Exemple** :
```bash
dorevia.sh app status odoo prod laplatine
```

**Que fait cette commande ?**  
Elle affiche l'état de vos services (démarrés, arrêtés, en erreur).

---

## Cas d'Usage Pratiques

### Cas 1 : Déployer Odoo en Production pour la Première Fois

**Objectif** : Mettre en ligne Odoo pour votre entreprise.

**Étapes** :

1. **Configurer le déploiement** :
   ```bash
   dorevia.sh prompt laplatine --env prod
   ```
   - Répondez aux questions (odoo, mode SaaS, domaine par défaut)

2. **Générer les fichiers** :
   ```bash
   dorevia.sh render laplatine --env prod
   ```

3. **Vérifier que tout est prêt** :
   ```bash
   dorevia.sh preflight laplatine --env prod
   ```

4. **Déployer** :
   ```bash
   dorevia.sh apply laplatine --env prod --auto-gateway
   ```

5. **Vérifier que ça fonctionne** :
   ```bash
   dorevia.sh app status odoo prod laplatine
   ```

**Résultat** : Odoo est accessible à l'adresse `odoo.prod.laplatine.doreviateam.com`

---

### Cas 2 : Utiliser Votre Propre Domaine

**Objectif** : Utiliser votre domaine (ex: `sarl-la-platine.fr`) au lieu du domaine par défaut.

**Étapes** :

1. **Configurer avec votre domaine** :
   ```bash
   dorevia.sh prompt laplatine --env prod
   ```
   - Choisissez "Client" ou "Hybride" comme mode
   - Saisissez votre domaine : `sarl-la-platine.fr`
   - Confirmez le fallback (recommandé)

2. **Générer les fichiers** :
   ```bash
   dorevia.sh render laplatine --env prod
   ```

3. **Vérifier les DNS** (important !) :
   ```bash
   dorevia.sh preflight laplatine --env prod --check-dns
   ```
   - ⚠️ Si les DNS ne sont pas configurés, vous devrez les configurer chez votre registrar

4. **Déployer** :
   ```bash
   dorevia.sh apply laplatine --env prod --auto-gateway
   ```

**Résultat** : Odoo est accessible à l'adresse `odoo.prod.laplatine.sarl-la-platine.fr`

---

### Cas 3 : Déployer sur un Serveur Client

**Objectif** : Déployer votre application sur votre propre serveur (IONOS, etc.).

**Étapes** :

1. **Configurer le serveur** :
   ```bash
   dorevia.sh server add mon-serveur
   ```
   - Éditez le fichier `servers/mon-serveur.json` avec les informations de votre serveur

2. **Vérifier le serveur** :
   ```bash
   dorevia.sh server preflight mon-serveur
   ```

3. **Déployer la plateforme** :
   ```bash
   dorevia.sh platform up laplatine --server mon-serveur
   ```

4. **Déployer l'application** :
   ```bash
   dorevia.sh app up odoo prod laplatine --server mon-serveur
   ```

**Résultat** : Votre application est déployée sur votre serveur.

---

### Cas 4 : Faire une Sauvegarde

**Objectif** : Sauvegarder vos données avant une mise à jour ou en cas de problème.

**Étapes** :

1. **Faire la sauvegarde** :
   ```bash
   dorevia.sh backup <tenant> --server <nom_serveur>
   ```

**Exemple** :
```bash
dorevia.sh backup laplatine --server mon-serveur
```

**Que fait cette commande ?**  
Elle sauvegarde :
- Les bases de données (Vault, Odoo)
- Les fichiers stockés
- Les secrets (tokens)

**Résultat** : Un dossier de sauvegarde est créé dans `backups/`

---

### Cas 5 : Restaurer une Sauvegarde

**Objectif** : Récupérer vos données après un incident.

**Étapes** :

1. **Restaurer la sauvegarde** :
   ```bash
   dorevia.sh restore <tenant> --server <nom_serveur> --from <dossier_backup>
   ```

**Exemple** :
```bash
dorevia.sh restore laplatine --server mon-serveur --from backups/backup-laplatine-20260102T120000Z
```

**Que fait cette commande ?**  
Elle restaure :
- Les bases de données
- Les fichiers stockés
- Les secrets

**Résultat** : Vos données sont restaurées.

---

## FAQ

### Q1 : Que faire si une commande échoue ?

**R :** 
1. Lisez le message d'erreur (il indique généralement le problème)
2. Vérifiez que vous avez les permissions nécessaires
3. Vérifiez que Docker est démarré : `docker ps`
4. Contactez le support si le problème persiste

---

### Q2 : Comment savoir quelle commande utiliser ?

**R :** 
- Utilisez `dorevia.sh help` pour voir toutes les commandes
- Consultez ce tutoriel pour les cas d'usage courants
- En cas de doute, commencez par `prompt` pour configurer, puis `render` et `apply` pour déployer

---

### Q3 : Puis-je annuler un déploiement ?

**R :** 
Oui, vous pouvez arrêter une application :

```bash
dorevia.sh app down <univers> <env> <tenant>
```

**Exemple** :
```bash
dorevia.sh app down odoo prod laplatine
```

---

### Q4 : Que signifie "preflight" ?

**R :** 
C'est une vérification avant le décollage (comme pour un avion). La commande `preflight` vérifie que tout est prêt avant de déployer.

---

### Q5 : Dois-je configurer les DNS moi-même ?

**R :** 
Oui, dans tous les cas, vous devez configurer les DNS vous-même chez votre registrar (votre fournisseur de domaine).

**Comment faire ?**

1. **Obtenez la liste des enregistrements DNS nécessaires** :
   - La plateforme vous indique quels enregistrements DNS créer
   - Utilisez `dorevia.sh preflight <tenant> --env prod --check-dns` pour voir ce qui est requis

2. **Connectez-vous à votre registrar** (ex: OVH, IONOS, etc.)

3. **Créez les enregistrements A** :
   - Pour chaque hostname (canonique, fallback, alias)
   - Pointez vers l'IP de votre serveur

**Exemple** :
- Hostname : `odoo.prod.laplatine.sarl-la-platine.fr`
- Type : A
- Valeur : `85.215.206.213` (IP de votre serveur)

**Vérification** :
La commande `preflight --check-dns` vous indique si les DNS sont correctement configurés.

---

### Q6 : Combien de temps prend un déploiement ?

**R :** 
Cela dépend de la taille de votre application, mais généralement :
- Configuration (`prompt`) : 5-10 minutes
- Génération (`render`) : 1-2 minutes
- Déploiement (`apply`) : 5-15 minutes

---

### Q7 : Puis-je avoir plusieurs environnements en même temps ?

**R :** 
Oui ! Vous pouvez avoir `lab`, `stinger` et `prod` fonctionnant simultanément. Ils sont isolés les uns des autres.

---

## Besoin d'Aide ?

### Ressources Disponibles

1. **Ce tutoriel** : Pour les bases
2. **Guide Phase 1** : `ZeDocs/V2/GUIDE_PHASE1.md` (détails techniques)
3. **Guide Phase 2** : `ZeDocs/V2/GUIDE_PHASE2.md` (processus avancés)
4. **Guide Phase 3** : `ZeDocs/V2/GUIDE_PHASE3.md` (domaines et serveurs clients)

### Commandes Utiles

```bash
# Voir l'aide
dorevia.sh help

# Vérifier que tout est OK
dorevia.sh doctor

# Voir la version
dorevia.sh version
```

### En Cas de Problème

1. **Vérifiez les logs** : Les messages d'erreur indiquent généralement le problème
2. **Consultez la documentation** : Les guides détaillés sont dans `ZeDocs/V2/`
3. **Contactez le support** : En cas de problème persistant

---

## 📝 Résumé des Commandes Essentielles

| Commande | À quoi ça sert ? |
|----------|------------------|
| `dorevia.sh help` | Voir toutes les commandes |
| `dorevia.sh doctor` | Vérifier que tout est installé |
| `dorevia.sh prompt <tenant> --env <env>` | Configurer un déploiement (interactif) |
| `dorevia.sh render <tenant> --env <env>` | Générer les fichiers de configuration |
| `dorevia.sh preflight <tenant> --env <env>` | Vérifier avant déploiement |
| `dorevia.sh apply <tenant> --env <env>` | Déployer l'application |
| `dorevia.sh app status <univers> <env> <tenant>` | Voir le statut d'une application |
| `dorevia.sh gateway aggregate --reload` | Mettre à jour le serveur web |

---

**Dernière mise à jour** : 2026-01-02  
**Version** : 1.0

