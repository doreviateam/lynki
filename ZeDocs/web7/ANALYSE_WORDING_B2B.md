# 🔍 Analyse — Intégration Wording B2B dans la SPEC

**Date :** 2026-01-22  
**Document source :** `reco_spec.md`  
**Document cible :** `SPEC_REFONTE_V2.0_COMPLETE.md`

---

## 🎯 Objectif

Intégrer les recommandations de wording B2B professionnel dans la spécification, en passant d'un ton "humain → humain" à un ton **B2B professionnel, crédible CFO / investisseurs**.

---

## 📊 Comparaison : SPEC actuelle vs Recommandations B2B

### Section 1 : Hero

| Élément | SPEC actuelle | Recommandation B2B | Action |
|---------|---------------|-------------------|--------|
| Texte | "opérations financières" | "événements financières" | ✅ À mettre à jour |
| Message | (figé, à remplacer) | "Dorevia-Vault sécurise automatiquement vos événements financiers depuis votre ERP et génère des preuves vérifiables en cas de contrôle." | ✅ À intégrer |

**Impact :** Moyen — Le Hero est figé, mais le wording peut être ajusté si nécessaire.

---

### Section 2 : Positionnement

| Élément | SPEC actuelle | Recommandation B2B | Action |
|---------|---------------|-------------------|--------|
| Titre | "L'ERP est votre matière première. Nous la transformons en vérité." | (Conservé) | ✅ OK |
| Message clé | "Mais rien ne garantit leur **valeur probante**" | "Aujourd'hui, ces données ne sont pas **nativement probantes**" | ⚠️ À adapter |
| Promesse | "conformes LNE 2026 / NF525" | "conformes aux exigences LNE 2026 / NF525" | ✅ À mettre à jour |
| Carte | (Non spécifiée) | "Capture automatique des événements, horodatage et empreinte cryptographique. Les données deviennent fiables, traçables et juridiquement opposables." | ✅ À intégrer |

**Impact :** Élevé — Le wording est plus factuel et professionnel.

---

### Section 3 : Preuve

| Élément | SPEC actuelle | Recommandation B2B | Action |
|---------|---------------|-------------------|--------|
| Message principal | "Je ne te demande pas de me croire. Je te montre." | "Accédez à une démonstration réelle sur une instance en production." | ⚠️ **CHANGEMENT MAJEUR** |
| Titre | "Voir plutôt que croire" | (Conservé ou à adapter) | ⚠️ À évaluer |
| Liste | Instance Odoo réelle, Vrais flux, Collecte automatique, Preuves générées | Instance Odoo réelle, Flux de production, Collecte automatique, Preuves horodatées et vérifiables | ✅ À mettre à jour |
| Microcopy | "Instance réelle • Pas un fake • 30 minutes" | "Instance réelle • 30 minutes • Sans engagement" | ✅ À mettre à jour |

**Impact :** Élevé — Passage d'un ton personnel à un ton professionnel.

---

### Section 4 : Conversation & CTA

| Élément | SPEC actuelle | Recommandation B2B | Action |
|---------|---------------|-------------------|--------|
| Titre | "Prêt à passer aux chiffres prouvés ?" | "Échangeons sur votre contexte" | ⚠️ **CHANGEMENT MAJEUR** |
| Message d'accroche | "Vous avez une douleur métier ? Un contexte particulier ? Un ERP spécifique ?" | (Supprimé ou remplacé) | ⚠️ À supprimer |
| Message de transparence | "Je lis tous les messages. Je m'en sers pour affiner le produit." | "Chaque demande est analysée pour adapter la plateforme aux usages réels. Cet échange permet de qualifier votre environnement et valider l'adéquation produit." | ⚠️ **CHANGEMENT MAJEUR** |
| CTA primaire | "Demander une démo" | "Voir la démo" | ✅ À mettre à jour |
| CTA secondaire | "Parler de votre projet" | (Conservé ou à adapter) | ⚠️ À évaluer |

**Impact :** Très élevé — Passage complet d'un ton personnel à un ton B2B professionnel.

---

## ⚠️ Points d'attention

### 1. Perte de personnalité vs Gain de crédibilité

**Risque :** Le ton B2B peut rendre le site moins engageant, moins "startup".

**Mitigation :** 
- Conserver un équilibre : professionnel mais pas corporate figé
- Garder l'aspect "en construction" (startup sérieuse)
- Utiliser un vocabulaire métier mais accessible

### 2. Message "Je ne te demande pas de me croire"

**Problème :** Ce message est très personnel et ne correspond pas au ton B2B.

**Solution :** Remplacer par "Accédez à une démonstration réelle sur une instance en production."

### 3. Message de transparence "Je lis tous les messages"

**Problème :** Trop personnel, pas professionnel.

**Solution :** Remplacer par un message factuel sur l'analyse des demandes et la qualification.

---

## ✅ Recommandations d'intégration

### Option 1 : Intégration complète (recommandée)

**Appliquer toutes les recommandations B2B :**
- ✅ Ton professionnel partout
- ✅ Vocabulaire métier
- ✅ Messages factuels
- ✅ Crédibilité CFO/investisseurs

**Avantages :**
- Cohérence totale
- Crédibilité renforcée
- Alignement avec B2Brouter & Speeral

**Inconvénients :**
- Perte de personnalité
- Moins engageant émotionnellement

---

### Option 2 : Intégration partielle (compromis)

**Conserver certains éléments personnels :**
- Titre "Voir plutôt que croire" (plus engageant)
- Message d'accroche "Vous avez une douleur métier ?" (plus direct)

**Appliquer les changements B2B :**
- Message de transparence professionnel
- Wording factuel dans Positionnement
- Microcopy professionnelle

**Avantages :**
- Équilibre entre professionnel et engageant
- Conserve une certaine personnalité

**Inconvénients :**
- Moins cohérent
- Risque de confusion de ton

---

### Option 3 : A/B Testing

**Tester les deux versions :**
- Version A : Ton actuel (personnel)
- Version B : Ton B2B (professionnel)

**Mesurer :**
- Taux de conversion
- Engagement (scroll, temps sur page)
- Qualité des leads (CFO vs autres)

---

## 📋 Plan d'intégration recommandé

### Phase 1 : Mise à jour de la SPEC

1. **Section Hero**
   - [ ] Remplacer "opérations" par "événements"
   - [ ] Intégrer le message B2B complet

2. **Section Positionnement**
   - [ ] Adapter "valeur probante" → "nativement probantes"
   - [ ] Ajouter "aux exigences" avant LNE 2026 / NF525
   - [ ] Intégrer le texte de la carte "Ce que fait Dorevia-Vault"

3. **Section Preuve**
   - [ ] Remplacer le message personnel par "Accédez à une démonstration réelle..."
   - [ ] Mettre à jour la liste (flux de production, preuves horodatées)
   - [ ] Mettre à jour le microcopy

4. **Section Conversation & CTA**
   - [ ] Changer le titre en "Échangeons sur votre contexte"
   - [ ] Supprimer/réduire le message d'accroche personnel
   - [ ] Remplacer le message de transparence par le texte B2B
   - [ ] Changer "Demander une démo" → "Voir la démo"

---

### Phase 2 : Mise à jour de la maquette

1. **Appliquer les changements de wording**
2. **Tester la cohérence visuelle**
3. **Valider avec utilisateurs cibles (CFO)**

---

## 🎯 Résultat attendu

### Avant (ton actuel)
> "Ils construisent quelque chose d'important. Je veux en faire partie."

### Après (ton B2B)
> "Ils construisent une infrastructure sérieuse. Je veux comprendre comment ça fonctionne."

---

## 📝 Checklist de validation

### Ton et style
- [ ] Ton professionnel, posé, crédible
- [ ] Pas de "je", pas de proximité artificielle
- [ ] Vocabulaire métier (finance, conformité, ERP)
- [ ] Promesse claire, factuelle
- [ ] Startup sérieuse, pas corporate figé

### Messages clés
- [ ] "Événements financiers" utilisé partout
- [ ] "Nativement probantes" dans Positionnement
- [ ] Message Preuve professionnel
- [ ] Message Conversation B2B
- [ ] Pas de "Je lis tous les messages"

### Cohérence
- [ ] Tous les messages alignés sur le ton B2B
- [ ] Vocabulaire cohérent
- [ ] Pas de mélange de tons

---

## 🏁 Conclusion

**Recommandation :** **Option 1 — Intégration complète**

**Raisons :**
1. ✅ Cohérence totale du message
2. ✅ Crédibilité renforcée pour CFO/investisseurs
3. ✅ Alignement avec B2Brouter & Speeral
4. ✅ Positionnement clair : infrastructure sérieuse

**Prochaine étape :** Mettre à jour la SPEC avec les recommandations B2B, puis mettre à jour la maquette.

---

**Fin de l'analyse**
