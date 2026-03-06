# Odoo — Intégration iframe Linky v1.0

**Date:** 2026-02-20  
**Contexte:** Linky affiche Odoo en iframe sous le header. Odoo bloque par défaut l’intégration (X-Frame-Options).

---

## 1. Configuration Odoo (recommandée)

Pour autoriser l’iframe **uniquement depuis Linky**, configurer la CSP sur le serveur Odoo :

```
Content-Security-Policy: frame-ancestors https://linky.stinger.sarl-la-platine.doreviateam.com
```

Ou, si plusieurs domaines Linky :

```
Content-Security-Policy: frame-ancestors https://linky.stinger.sarl-la-platine.doreviateam.com https://linky.lab.sarl-la-platine.doreviateam.com
```

**Remarque :** Remplacer par les domaines réels de Linky selon l’environnement (lab, stinger, prod).

---

## 2. Fallback Linky

En cas d’iframe bloquée (CSP non configurée, autre domaine), Linky affiche un bouton :

> **Ouvrir Odoo dans un nouvel onglet**

L’utilisateur peut ainsi accéder à Odoo sans dépendre de la configuration serveur.

---

## 3. Séparation visuelle

- **Odoo** = système source (comptabilité, facturation)
- **Linky** = cockpit / preuve (KPI, DIVA, Vault)

Les deux applications restent distinctes. Pas de SSO bricolé en v1 : l’utilisateur se connecte à Odoo dans l’iframe si nécessaire.
