# Ticket — Cohérence Flux net (tuile vs vue détail)

**Référence** : ZeDocs/web55 — Linky cockpit  
**Date** : 2026-03-16  
**Statut** : ✅ Corrigé (alignement tuile = détail)

---

## Problème

Divergence constatée entre :

- **Synthèse (tuile)** : Flux net = + 8 053,09 €  
- **Vue détail (carte Flux net)** : Flux net = + 7 825,71 €  
- **Écart** : 227,38 €  

Pour un cockpit, une même notion métier (« flux net ») doit avoir **une seule définition** entre synthèse et détail. La divergence cassait la confiance et pouvait fragiliser la lecture Diva.

---

## Cause identifiée

- **Tuile** : alimentée par `dashboard-metrics`, qui utilisait le **net espèces** (by_method.cash) lorsque la clé était présente : `cashInMethod - cashOutMethod`.
- **Vue détail** : alimentée par `/api/payments-in` et `/api/payments-out`, avec **net total** : `encaissements - décaissements` (inTotal - outTotal).

Périmètre de calcul différent → écart de 227,38 € (part banque/carte).

---

## Correction appliquée

**Fichier** : `units/dorevia-linky/app/api/dashboard-metrics/route.ts`

- **Définition unique** : Flux net = **encaissements − décaissements (total)**.
- La tuile utilise désormais `cashNet = inTotal - outTotal` (comme la vue détail).
- Même formule, même source (agrégations payments-in / payments-out), même période / société.

Les deux vues affichent le même montant pour une même période et un même contexte.

---

## Vérifications recommandées (Check 1 à 3)

1. **Formule** : tuile et détail utilisent bien `encaissements - décaissements` (totaux).
2. **Photo de données** : même `tenant`, `date_debut`, `date_fin`, `company_id` ; même snapshot Vault (pas de décalage temporel volontaire).
3. **Delta résiduel** : si un écart réapparaît, investiguer mouvement manquant, arrondi, ligne fiscale ou flux exclu d’un côté.

---

## Référence produit

> Aligner la définition métier et la source de calcul de Flux net entre tuile synthèse et vue détail ; expliquer et supprimer le delta.
