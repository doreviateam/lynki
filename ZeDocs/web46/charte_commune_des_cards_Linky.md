# SPEC — Linky Charte commune des cards

**Version :** 2.0  
**Date :** 14 mars 2026  
**Produit :** Dorevia Linky  
**Statut :** Spécification UI transverse

---

## 1. Objet

Cette spécification définit la **charte commune des cards Linky** afin de garantir une cohérence visuelle et structurelle sur l’ensemble du cockpit.

Le périmètre couvre exclusivement :

- le **header** des cards,
- le **footer** des cards,
- le **contour / silhouette** des cards,
- les variantes autorisées selon le type d’instrument.

L’objectif n’est pas d’uniformiser le contenu métier des instruments, mais de leur imposer une **grammaire visuelle commune**.

---

## 2. Problème constaté

Les itérations précédentes ont amélioré la lisibilité des cards, mais plusieurs divergences subsistent encore dans les écrans observés :

- certains instruments utilisent un **liseré gauche fort** ; d’autres non ;
- certains headers sont structurés en **titre + statut + KPI** ; d’autres restent plus libres ;
- certaines cards portent une action parasite en header (`Rafraîchir`) ou en footer (`Afficher évolution`) ;
- certaines cards utilisent des **titres centrés** ou des headers atypiques (`Z de caisse`) ;
- certaines cards “vides” ou “bientôt disponibles” ne respectent pas la même silhouette que les cards actives.

Conséquence : le cockpit donne encore l’impression d’un assemblage d’instruments voisins, plutôt que d’un système UI rigoureux et unifié.

---

## 3. Principe directeur

Chaque card Linky doit se lire selon la même logique :

- **Header = identité de l’instrument**
- **Body = lecture métier**
- **Footer = contexte de lecture**

Le contour, le header et le footer ne doivent jamais réinventer une grammaire locale.

La différenciation entre instruments doit vivre dans :

- le contenu métier,
- le statut,
- la couleur sémantique,
- les composants internes,

et non dans une architecture de card différente à chaque fois.

---

## 3 bis. Règles UI non négociables

Les règles suivantes sont **figées produit** : toute nouvelle card ou évolution doit les respecter sans exception.

| Règle | Description |
|--------|-------------|
| **Header commun** | Bloc gauche = icône + titre + badge(s) ; bloc droit = libellé KPI + valeur. Aucune action primaire (ex. Rafraîchir). |
| **Footer contextuel commun** | Contexte de lecture uniquement (source, période, fraîcheur). Pas d’action en footer sauf exception documentée. |
| **Contour commun** | Même silhouette (radius, bordure, ombre) pour toutes les cards. Pas de contour d’exception. |
| **Badges communs** | Un seul système de badge de statut (sévérité info / success / vigilance / alert), hauteur et espacement fixes. |
| **Métadonnées footer** | Ordre standard : **Source** · **Période** · **Fraîcheur** (ou mode de lecture). Séparateur recommandé : ` · ` (espace point espace). |
| **Bloc Évolution obligatoire** | Sur toute card instrument en production, un bloc Évolution est présent (ligne d’entrée « Évolution », zone de contenu ou état vide/erreur/chargement). Absence admise uniquement pour placeholder « bientôt disponible » ou exception documentée. |

Implémentation de référence : `InstrumentCardChrome` (header, footer, badges) ; `InstrumentCardEvolutionBlock` (bloc Évolution). La hauteur minimale du footer, le padding vertical et la typographie du footer sont fixés par le composant commun pour éviter les dérives.

---

## 4. Charte commune — contour des cards

### 4.1 Silhouette de base

Toutes les cards doivent partager la même silhouette de base :

- **rayon de bordure identique**,
- **hauteur de contour identique**,
- **épaisseur de bordure identique**,
- **même couleur de fond card**,
- **même logique de séparateurs internes**,
- **même padding externe**.

### 4.2 Spécification visuelle du contour

Règle commune :

- contour principal : **1 px**
- angle : **arrondi uniforme**
- fond : surface card Linky standard
- ombre : minimale ou absente
- séparation interne : lignes horizontales discrètes, même opacité partout

### 4.3 Accent sémantique latéral

Les instruments peuvent conserver un **accent sémantique vertical à gauche**, mais celui-ci doit être normalisé.

Règle :

- accent autorisé uniquement sous forme de **liseré vertical fin**, intégré au contour,
- largeur fixe,
- même rayon que la card,
- jamais de barre locale flottante dans le header,
- jamais de contour partiel différent d’une card à l’autre.

### 4.4 Couleurs d’accent autorisées

Le liseré gauche peut varier selon la famille métier :

- **bleu** : information / structure / instrument neutre
- **vert** : positif / performance / activité saine
- **orange** : attention / couverture partielle / alerte modérée
- **rouge** : tension / risque / retard / anomalie forte
- **gris / blanc atténué** : indisponible / bientôt disponible / hors périmètre

### 4.5 Interdictions

Sont interdits :

- grand contour spécial d’une seule card,
- barre verticale uniquement dans le header,
- bordure colorée complète sur certaines cards et pas sur d’autres,
- silhouette “exceptionnelle” pour un instrument isolé,
- header sans alignement avec la grille commune.

---

## 5. Charte commune — header

## 5.1 Rôle du header

Le header doit répondre à une seule question :

**Quel instrument suis-je en train de lire et quel est son état global ?**

Il ne doit pas devenir une zone d’actions, ni une zone narrative autonome.

### 5.2 Structure obligatoire

Le header de chaque card est composé de deux blocs :

#### Bloc gauche

Toujours dans cet ordre :

1. **icône instrument**
2. **titre instrument**
3. **badge ou libellé de statut** (optionnel)
4. **badge secondaire** (optionnel et rare)

#### Bloc droit

Toujours dans cet ordre :

1. **libellé KPI principal** (optionnel selon le type de card)
2. **valeur KPI principale**
3. **sous-valeur ou ratio secondaire** (optionnel)

### 5.3 Alignement

Le bloc gauche et le bloc droit doivent partager :

- le même axe vertical,
- la même hauteur minimale de header,
- le même alignement haut ou centre selon la variante,
- des espacements constants entre icône, titre et statut.

### 5.4 Règles de titre

Le titre instrument :

- est toujours **aligné à gauche**,
- est toujours en **majuscules ou petites capitales cohérentes** selon la famille Linky,
- n’est jamais centré,
- n’est jamais seul au milieu de la card,
- n’est jamais traité comme un simple label de section.

Exemples conformes :

- `TRÉSORERIE`
- `BUSINESS`
- `FLUX NET`
- `ENCOURS`
- `PAIEMENTS`
- `NOTES DE CRÉDIT`
- `POINTS DE VENTE`

Exemple non conforme :

- `Z DE CAISSE` centré dans la card sans structure header gauche/droite.

### 5.5 Règles de statut

Le statut est une information de synthèse courte.

**Badge (règle UI non négociable)** : espacement badge ↔ titre et hauteur du badge sont fixés par le composant commun (`InstrumentCardStatusBadge`). Les niveaux de sévérité (info, success, vigilance, alert) et leurs couleurs sont uniques pour toute la famille de cards.

Formes autorisées :

- texte simple coloré,
- badge texte discret,
- badge secondaire léger.

Formes recommandées :

- `Validation partielle`
- `Solide`
- `Flux net positif mais volatil`
- `Proxy`
- `Hors périmètre`
- `Bientôt disponible`

### 5.6 Règle sur les badges secondaires

Un second badge n’est autorisé que s’il apporte une information réellement distincte du statut principal.

Exemple :

- `Solide` + `Certifié` n’est acceptable que si **Certifié** a une signification métier stable, documentée et réutilisable ailleurs.

Sinon, il doit être supprimé.

### 5.7 KPI principal

Le KPI principal doit être placé à droite quand l’instrument a une valeur de synthèse claire.

Exemples :

- Trésorerie validée Vault
- Marge commerciale
- Flux net
- Créances ouvertes
- Marge brute
- Solde taxes

### 5.8 Cas sans KPI principal

Une card peut ne pas afficher de KPI principal en header si :

- elle est en état vide,
- elle est “bientôt disponible”,
- elle expose avant tout une lecture narrative ou structurelle.

Dans ce cas, le header conserve malgré tout sa structure gauche/droite ; le bloc droit peut être vide ou réservé à un libellé discret d’état.

### 5.9 Interdictions en header

Sont interdits :

- bouton `Rafraîchir`,
- CTA fonctionnel isolé,
- action redondante,
- cartouche KPI spécial non aligné avec les autres,
- titre centré qui casse la grille,
- header vide suivi d’un bloc héroïque dans le body.

---

## 6. Charte commune — footer

### 6.1 Rôle du footer

Le footer sert uniquement à afficher le **contexte d’interprétation** de la card.

Il n’a pas vocation à porter des actions de navigation ou de duplication d’action.

### 6.2 Structure obligatoire

Le footer est une ligne basse de contexte contenant :

- période ou date de lecture,
- source(s),
- mode de calcul ou statut de couverture,
- éventuellement un qualificatif de périmètre.

**Ordre standard des métadonnées** (lorsque plusieurs éléments sont présents) :

1. **Source** (ex. Source Vault, Source Odoo + POS)
2. **Période** (ex. Période : exercice à date)
3. **Fraîcheur / mode de lecture** (ex. Données : instantané, temps réel, exercice à date)

Séparateur recommandé : ` · ` (espace point espace).

**Hauteur et typographie** : même hauteur minimale de footer sur toutes les cards, padding vertical et taille de police fixés par le composant commun (`InstrumentCardFooter`) pour garantir une ligne de base visuelle identique.

Exemples conformes :

- `Source : Vault · Période : exercice à date · Données : instantané`
- `Période : exercice à date · Source Odoo + POS`
- `Source : Vault · ar-by-partner · instantané`
- `Cycle d'exploitation · AR − AP · Source Vault`

### 6.3 Action dans le footer

Règle générale : **aucune action dans le footer**.

Donc suppression des motifs suivants :

- `Afficher évolution`
- `Afficher détail`
- `Voir exposition`
- `Détail` placé comme simple action de footer/header si déjà redondant

### 6.4 Exception unique

Une action en footer n’est autorisée que si :

- elle est la **seule action disponible de la card**,
- elle n’est visible nulle part ailleurs,
- elle est structurellement nécessaire,
- elle est standardisée dans toute la famille concernée.

Cette exception doit rester rare.

### 6.5 Interdictions en footer

Sont interdits :

- action dupliquée du body,
- badge de statut en footer,
- bouton d’action primaire,
- sur-signature visuelle,
- footer absent sur une card active si les autres en ont un.

---

## 7. Variantes autorisées de card

La charte commune n’impose pas un contenu métier identique. Elle autorise plusieurs variantes, à condition qu’elles respectent la même structure globale.

### 7.1 Variante A — Card de synthèse compacte

Usage :

- Trésorerie
- Flux net
- Taxes
- Notes de crédit
- Remboursements

Structure :

- header standard
- body de 2 à 6 lignes de lecture
- 0 à 1 section dépliable dans le body
- footer de contexte

### 7.2 Variante B — Card analytique dense

Usage :

- Business
- Encours
- BFR
- EBE
- Paiements

Structure :

- header standard
- body multi-sections
- blocs internes autorisés
- indicateurs secondaires autorisés
- footer de contexte

### 7.3 Variante C — Card d’état vide

Usage :

- Points de vente sans activité
- Remboursements nuls
- Notes de crédit nulles

Structure :

- header standard
- body court avec état vide explicite
- footer de contexte facultatif si la lecture est instantanée

### 7.4 Variante D — Card indisponible / bientôt disponible

Usage :

- Z de caisse
- modules futurs

Structure :

- header standard obligatoire
- body minimal : `Bientôt disponible` ou message de périmètre
- footer facultatif
- pas de centrage libre qui casse la charte

---

## 8. Composants internes et relation avec la charte

La charte commune ne supprime pas les composants internes métier, mais elle impose qu’ils commencent **après** le header.

Sont autorisés dans le body :

- ligne `Évolution` avec action `Afficher`,
- accordéons,
- tableaux simplifiés,
- barres de progression,
- sous-cards internes,
- badges d’alerte métier,
- blocs “composantes manquantes”,
- état vide contextualisé.

Règle :

- les actions de body restent dans le body,
- elles ne remontent ni en header ni en footer.

---

## 9. Système sémantique des couleurs

Les couleurs ne doivent plus redéfinir la structure des cards. Elles servent uniquement à porter le sens.

### 9.1 Usages autorisés de la couleur

- icône instrument,
- liseré gauche normalisé,
- statut,
- KPI principal,
- alertes métier,
- valeurs en tension,
- ratios positifs / négatifs.

### 9.2 Usages interdits de la couleur

- réinventer le contour complet,
- créer un header d’exception,
- créer une famille de card sans grille commune,
- produire un “mode spécial” non documenté.

---

## 10. Règles spécifiques issues des écrans observés

### 10.1 Trésorerie

À conserver :

- titre gauche,
- statut `Validation partielle`,
- KPI droit,
- footer de contexte.

À interdire définitivement :

- bouton `Rafraîchir` en header.

### 10.2 Flux net

À conserver :

- titre gauche,
- statut de synthèse,
- KPI droit,
- footer purement informatif.

À interdire définitivement :

- `Afficher évolution` en footer.

### 10.3 Business

À encadrer :

- `Certifié` doit être soit documenté comme badge secondaire officiel, soit supprimé.

### 10.4 Paiements / Encours / EBE / Taxes / Notes de crédit / Remboursements / Points de vente

Ces instruments doivent tous adopter :

- même contour,
- même header,
- même logique de footer,
- même discipline sur les actions.

### 10.5 Z de caisse

La version centrée actuelle n’est pas conforme.

La card doit devenir :

- header standard avec icône + titre à gauche,
- état `Bientôt disponible` dans le body,
- éventuellement bloc droit vide ou statut discret.

---

## 11. Grille de conformité

Une card Linky est **conforme** si, et seulement si :

1. sa silhouette est identique aux autres cards ;
2. son accent latéral suit la règle commune ;
3. son header respecte la structure gauche/droite ;
4. son titre est aligné à gauche ;
5. son KPI principal est dans le bloc droit quand il existe ;
6. aucune action parasite n’existe dans le header ;
7. le footer est contextuel et non actionnel ;
8. les actions métier vivent dans le body ;
9. la couleur n’est pas utilisée pour casser la structure commune ;
10. la card reste lisible comme membre d’une même famille produit.

---

## 12. Proposition de composants front

La charte doit idéalement être portée par des composants partagés.

### 12.1 Composants recommandés

- `InstrumentCard`
- `InstrumentCardAccent`
- `InstrumentCardHeader`
- `InstrumentCardHeaderLeft`
- `InstrumentCardHeaderRight`
- `InstrumentCardStatus`
- `InstrumentCardKpi`
- `InstrumentCardBody`
- `InstrumentCardFooter`

### 12.2 Props minimales recommandées

#### `InstrumentCard`

- `tone`: `neutral | positive | warning | danger | muted`
- `density`: `compact | standard | dense`
- `state`: `active | empty | unavailable`

#### `InstrumentCardHeader`

- `icon`
- `title`
- `status`
- `secondaryStatus`
- `kpiLabel`
- `kpiValue`
- `kpiMeta`

#### `InstrumentCardFooter`

- `context`
- `sources`
- `asOf`
- `coverage`

---

## 13. Décisions UI à acter

### 13.1 Décisions fermes

- suppression de `Rafraîchir` en header,
- suppression des actions de footer,
- titre toujours aligné à gauche,
- bloc KPI toujours à droite quand il existe,
- contour commun avec accent latéral normalisé,
- interdiction des silhouettes d’exception.

### 13.2 Décisions à arbitrer

- maintien ou suppression de `Certifié`,
- présence systématique ou non du footer sur les états vides,
- niveau exact de contraste du liseré gauche,
- format typographique exact des titres (uppercase ou petite capitale).

---

## 14. Conclusion

La prochaine étape de maturité visuelle de Linky ne consiste plus à ajuster card par card, mais à verrouiller une **charte transversale de structure**.

Cette charte doit garantir que, quel que soit l’instrument affiché :

- la silhouette est immédiatement reconnaissable,
- le header raconte toujours la même chose,
- le footer joue toujours le même rôle,
- la couleur reste sémantique,
- la card appartient visiblement à une même famille produit.

C’est cette rigueur qui fera basculer le cockpit de **bon dashboard spécialisé** vers **vrai système d’instruments premium**.

