# Glossaire Lynki / Diva — Référence normative

**Date** : mars 2026  
**Version** : 1.1
**Décision LANG-03b — Source de vérité des libellés** : la normalisation est appliquée dans Diva, via la fonction  dans , avant injection des libellés amont (Label, StatusReason) dans les faits de gouvernance. Les libellés Vault / agrégations ne sont pas modifiés à la source. Cette décision est réversible si un contrat amont « libellés propres » est établi avec Vault.  
**Répertoire** : `ZeDocs/web56`  
**Source** : Note de cadrage `Note_Normalisation_Langue_Lynki.md` (§7)

Ce document est la **référence autonome** pour la normalisation linguistique des sorties Lynki et Diva. Toute recette éditoriale ou implémentation (post-traitement, UI, payloads) doit s’y aligner.

> **Décision LANG-03b — Source de vérité des libellés** : la normalisation est appliquée **dans Diva**, via la fonction `normalizeLabel` dans `units/diva/internal/facts/engine.go`, avant injection des libellés amont (Label, StatusReason) dans les faits de gouvernance. Les libellés Vault / agrégations ne sont pas modifiés à la source. Décision réversible si un contrat amont « libellés propres » est établi avec Vault.

---

## 1. Table de correspondance normative

| Terme source | Terme français préféré | Règle d'usage |
|--------------|------------------------|---------------|
| business | activité commerciale | Toujours en sortie user |
| cash | trésorerie disponible | Si on parle de liquidité mobilisable |
| cash position | position de trésorerie | Si on parle de position au sens large |
| net cash | trésorerie nette | Toujours |
| post-tax cash | trésorerie nette post-taxes | Si taxes déjà déduites |
| net flow | flux net | Toujours |
| cash flow | flux de trésorerie | Pour texte explicatif long |
| AR | créances ouvertes | Toujours en sortie user |
| receivables | créances clients | Toujours |
| overdue receivables | créances en retard | Toujours |
| at-risk receivables | créances à risque | Si le risque est qualifié |
| watch | à surveiller | Ne jamais afficher « watch » |
| warning | vigilance | Préférer « vigilance » |
| alert | vigilance | Préférer « vigilance » |
| critical | critique | Seulement si règle métier explicite |
| issue | point de vigilance | Ne jamais afficher « issue » |
| driver | inducteur | À utiliser avec parcimonie |
| business driver | inducteur d'activité | Rare ; sinon reformuler |
| payload | données transmises | Jamais côté user final |
| headline | phrase d'ouverture | Jamais côté user |
| insight | lecture / insight | « Insight » toléré comme terme interne produit |
| explain | explication détaillée | Toujours |
| refresh | actualiser | Toujours |
| stale | périmé / ancien | Selon contexte |
| fresh | à jour / récent | Selon contexte |
| data completeness | complétude des données | Doc interne ou tooltip |
| fallback | mode dégradé | Si vraiment nécessaire |
| cache hit | lecture store | Jamais côté user |
| runner | moteur de précalcul | Doc technique uniquement |
| store | stockage persistant / store | « Store » toléré en doc technique |
| default | par défaut | Toujours |
| benchmark | référence de mesure | Toujours |

---

## 2. Termes interdits en sortie user

Les termes suivants **ne doivent pas apparaître** dans un texte affiché dans Lynki, sauf exception validée :

- business  
- cash  
- AR  
- watch  
- issue  
- payload  
- runner  
- cache hit  
- fallback  
- prompt  
- headline  
- stale  
- refresh job  
- debug  
- critical *(si non justifié)*  

---

## 3. Termes préférés en sortie user

À **privilégier** :

- activité commerciale  
- trésorerie disponible  
- trésorerie nette  
- trésorerie nette post-taxes  
- flux net  
- créances ouvertes  
- créances en retard  
- créances à risque  
- retards de paiement  
- point de vigilance  
- actualisation en cours  
- calculé il y a X min  
- données utilisées  
- position nette  
- encours client  
- chiffre d'affaires  
- part significative  
- concentration du risque client  
- partenaire principal en retard  
- créances en recouvrement  
- montant en attente d'encaissement  
