# 📖 Guide d'utilisation — Encadrés éditoriaux Blog Dorevia-Vault

**Version :** v1.0  
**Date :** 24 janvier 2026  
**Conforme à :** SPEC Blog Dorevia-Vault v1.0

---

## 1. Vue d'ensemble

Les encadrés éditoriaux sont des composants visuels qui structurent et clarifient le contenu des articles. Ils sont conçus pour :

- **Définition** : Clarifier un concept clé
- **À retenir** : Mettre en avant 3 points essentiels (max)
- **Exemple** : Illustrer avec un scénario concret (ERP / CFO / audit)

---

## 2. Format Markdown dans le contenu

Les encadrés sont intégrés directement dans le contenu Markdown de l'article via des blocs spéciaux.

### 2.1 Encadré Définition

**Usage :** Clarification d'un concept clé

**Syntaxe :**
```markdown
<!-- ENCADRE:DEFINITION -->
Une preuve financière est un mécanisme d'intégrité vérifiable qui garantit qu'un événement n'a pas été modifié après sa validation.
<!-- /ENCADRE:DEFINITION -->
```

**Rendu :** Encadré bleu avec icône 📖 et bordure gauche accent

---

### 2.2 Encadré À retenir

**Usage :** 3 points essentiels maximum, 1 par article

**Syntaxe :**
```markdown
<!-- ENCADRE:A_RETENIR -->
- Un chiffre non prouvé est un risque opérationnel
- La preuve doit être vérifiable sans intervention humaine
- L'horodatage seul ne suffit pas, il faut un hash cryptographique
<!-- /ENCADRE:A_RETENIR -->
```

**Rendu :** Encadré jaune avec icône 💡 et liste à puces

**Règles :**
- Maximum 3 points
- 1 seul encadré "À retenir" par article
- Points concis (1 ligne chacun)

---

### 2.3 Encadré Exemple

**Usage :** Scénario concret ERP / CFO / audit

**Syntaxe :**
```markdown
<!-- ENCADRE:EXEMPLE -->
Un CFO valide une facture dans Odoo le 15 janvier 2026. Dorevia-Vault capture l'événement, génère un hash SHA-256 et l'horodate via un serveur de temps certifié. Trois mois plus tard, lors d'un contrôle fiscal, le contrôleur peut vérifier l'intégrité de la facture en comparant le hash stocké avec celui recalculé. Si les hashs correspondent, la preuve est valide.
<!-- /ENCADRE:EXEMPLE -->
```

**Rendu :** Encadré bleu clair avec icône 🔍

---

## 3. Exemple complet d'article

```markdown
# Sceller un événement financier : définition et implications

Une fois validé dans votre ERP, un événement financier doit être scellé pour devenir une preuve.

<!-- ENCADRE:DEFINITION -->
Sceller un événement financier signifie générer une empreinte cryptographique (hash) unique et irréversible qui garantit l'intégrité du document. Cette empreinte est horodatée et stockée de manière immuable.
<!-- /ENCADRE:DEFINITION -->

## Pourquoi sceller ?

Le scellage transforme un simple export en preuve opposable.

<!-- ENCADRE:EXEMPLE -->
Un comptable exporte une facture en PDF depuis Odoo. Sans scellage, ce PDF peut être modifié après coup. Avec Dorevia-Vault, dès la validation dans Odoo, un hash est généré. Si le PDF est modifié ultérieurement, le hash ne correspondra plus, révélant la manipulation.
<!-- /ENCADRE:EXEMPLE -->

## Les implications

Le scellage a des conséquences opérationnelles et juridiques.

<!-- ENCADRE:A_RETENIR -->
- Un événement scellé ne peut plus être modifié sans être détecté
- Le hash doit être stocké indépendamment de l'ERP
- L'horodatage doit provenir d'un serveur de temps certifié
<!-- /ENCADRE:A_RETENIR -->

## Conclusion

Le scellage est la base de la preuve financière.
```

---

## 4. Traitement technique

### 4.1 Parsing dans MarkdownService

Le `MarkdownService` détecte automatiquement les blocs `<!-- ENCADRE:... -->` et les remplace par des placeholders HTML avec des `data-attributes`.

**Exemple de placeholder généré :**
```html
<div class="blog-encadre-placeholder" 
     data-type="definition" 
     data-content="Une preuve financière est un mécanisme...">
</div>
```

### 4.2 Rendu côté client

Un script JavaScript (dans `blog/show.html.twig`) remplace automatiquement les placeholders par les composants visuels réels au chargement de la page.

**Avantages :**
- ✅ Pas de dépendance Twig dans le service
- ✅ Rendu immédiat au chargement
- ✅ Compatible avec le cache

**Note :** Pour un rendu côté serveur, on peut créer une extension Twig personnalisée (amélioration future).

---

## 5. Règles d'usage

### Définition
- ✅ Utiliser pour clarifier un concept technique ou réglementaire
- ✅ 1-2 phrases maximum
- ✅ Langage précis, accessible

### À retenir
- ✅ Maximum 3 points
- ✅ 1 seul encadré par article
- ✅ Points essentiels, actionnables
- ❌ Ne pas utiliser pour des listes de fonctionnalités

### Exemple
- ✅ Scénario concret (ERP, CFO, audit)
- ✅ Situation réelle ou réaliste
- ✅ 3-5 phrases
- ❌ Ne pas utiliser pour des cas d'usage marketing

---

## 6. Checklist avant publication

Pour chaque article :

- [ ] 1 H1 (titre principal)
- [ ] 3 à 5 H2 (sections)
- [ ] 1 encadré "À retenir" (3 points max)
- [ ] 0 à 2 encadrés "Définition" (si concepts complexes)
- [ ] 0 à 2 encadrés "Exemple" (si besoin d'illustration)
- [ ] Meta description unique
- [ ] CTA doux en fin d'article (automatique)
- [ ] Articles liés (automatique)

---

## 7. Exemples de bonnes pratiques

### ✅ Bon usage de "À retenir"

```markdown
<!-- ENCADRE:A_RETENIR -->
- Un hash SHA-256 est irréversible : on ne peut pas retrouver le document original
- L'horodatage doit être certifié par un tiers de confiance
- La preuve doit être stockée indépendamment de l'ERP source
<!-- /ENCADRE:A_RETENIR -->
```

### ❌ Mauvais usage

```markdown
<!-- ENCADRE:A_RETENIR -->
- Dorevia-Vault est la meilleure solution
- Nous avons 10 ans d'expérience
- Nos clients sont satisfaits
<!-- /ENCADRE:A_RETENIR -->
```
→ Trop commercial, pas pédagogique

---

## 8. Intégration dans l'éditeur

Si vous utilisez un éditeur Markdown (ex: EasyAdmin), vous pouvez :

1. **Ajouter des boutons** pour insérer les blocs encadrés
2. **Prévisualiser** le rendu des encadrés
3. **Valider** qu'il n'y a qu'un seul "À retenir"

---

## 9. Support technique

**Fichiers concernés :**
- `templates/components/blog-encadre-definition.html.twig`
- `templates/components/blog-encadre-a-retenir.html.twig`
- `templates/components/blog-encadre-exemple.html.twig`
- `src/Service/MarkdownService.php` (à modifier pour parser les encadrés)

**CSS :** Les styles sont dans `public/assets/css/blog-v2.css`

---

**Document de référence — Dorevia-Vault Blog**
