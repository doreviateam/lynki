# Spécification — Tuile Pilotage « Business » (Classe A)

> **Statut :** brouillon — à compléter à partir du CDCF.  
> **Référence normative :** `ZeDocs/web61/cdcf.md` — §3 (Pilotage), **§3.6** (référentiel 12 tuiles), **§5** (grammaire d’une tuile).  
> **Modèle de rédaction :** `cdcf.md` **§6** (fiche Trésorerie) ; toute future **vue détail Business** suivra la logique **§6.0** (fiche = promesse ; section vue détail = composition d’écran qui prime pour l’UI).

---

## 1. Objet

*(À rédiger.)* Instrument **Classe A** : lecture prioritaire du cockpit ; lien avec ventes / achats et résultat d’activité sur la période affichée (aligner le vocabulaire sur l’implémentation Lynki actuelle et le CDCF).

## 2. Finalité métier

*(À rédiger.)* Questions que la tuile doit permettre de trancher rapidement (cf. esprit §6.2 Trésorerie).

## 3. Données d’entrée

### 3.1 Données de contexte

Header global : tenant, société, période, année — comme §6.3.1.

### 3.2 Données métier attendues

*(À lister : ventes, achats, devise, agrégations, etc.)*

### 3.3 Principe de dépendance

*(Aligner sur §6.3.3.)*

## 4. Calcul métier

*(À rédiger : règle fonctionnelle de la valeur principale, honnêteté, non-surinterprétation — réutiliser la structure §6.4.)*

## 5. Valeur principale affichée

*(Nature, format, unicité — §5.5 du CDCF / §6.5 Trésorerie.)*

## 6. Contexte d’interprétation

*(§6.6 équivalent.)*

## 7. Signal de confiance

*(Dimensions : proxy, partiel, fiable — cohérence avec la doctrine commune §5.8 et futures consolidations V2 §4.)*

## 8. Variantes d’état de la tuile

*(Nominal, chargement, vide, partiel, erreur — §6.8.)*

## 9. Vue détaillée Business

*(Promesse fonctionnelle des contenus ; **découpe d’écran** dans un futur § équivalent au §7 Trésorerie, avec **§6.0** du CDCF applicable.)*

## 10. Critères de qualité métier

*(§6.10 équivalent.)*

## 11. Règles UX spécifiques

*(Compléter ; mutualiser avec §14 V2 / §5.12 quand c’est du transverse.)*

## 12. Hors périmètre

*(§6.12 équivalent.)*

## 13. Principe directeur

*(Une phrase d’ancrage produit.)*

---

## Traçabilité

| Élément | Statut |
|---------|--------|
| Alignement CDCF §5 | À valider |
| Alignement API / métriques dashboard | À renseigner |
| Recette cockpit | À définir |

**Suite logique du plan CDCF :** après stabilisation de cette spec, produire `SPEC_PILOTAGE_FLUX_NET.md` sur le même gabarit.
