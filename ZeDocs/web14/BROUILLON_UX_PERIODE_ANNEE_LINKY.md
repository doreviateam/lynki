# Brouillon — Période Linky : Mois/Trimestre + Année

**Statut** : Implémenté (2 champs).  
**Contexte** : Les infos des cartes (Ventes, Achats) conviennent ; le filtre Période a été simplifié en deux champs.

---

## Modèle retenu (implémenté)

- **Premier champ** : Mois, Trimestre ou Semaine — Janvier…Décembre, Trimestre 1–4, Semaine 1–53 (semaine ISO, lundi–dimanche).
- **Deuxième champ** : Année — select avec année courante et les 5 années passées.
- **Défaut** : Mois en cours / Année en cours (comportement conservé).
- La période affichée dans les cartes reste une plage from/to (1er–dernier jour du mois ou du trimestre).

---

## Décision : période par défaut

**Période par défaut : Mois en cours / Année en cours.**

- Comportement actuel : au chargement, période = mois civil en cours (année en cours). Le preset affiché est « Mois en cours ». C’est déjà en place dans le code.

---

## Fichiers modifiés

- `units/dorevia-linky/app/lib/period-utils.ts` : `PERIOD_OPTIONS`, `getAvailableYears()`, `getPeriodFromKeyAndYear()`, `getKeyAndYearFromPeriod()`.
- `units/dorevia-linky/components/ReportHeader.tsx` : deux `<select>` (Mois/Trimestre + Année), plus de presets ni période personnalisée.
