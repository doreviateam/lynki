# 📊 Évaluation — SPEC Hero Dorevia-Vault v1.0

**Date :** 2026-01-19  
**Évaluateur :** Auto (IA)  
**Version spec :** v1.0 (FIGÉ - validé)  
**Template analysé :** `landing/index.html.twig`

---

## ✅ Points forts de la spécification

1. **Message clair** : Focus sur sécurisation, traçabilité, preuve
2. **Évite le jargon** : Pas de "conforme", pas de NF525/LNE
3. **Structure pédagogique** : H1 → H2 → Texte → Process → CTA
4. **Statut FIGÉ** : Référence officielle, toute modification = nouvelle version

---

## 🔴 Écarts critiques identifiés

### 1. H1 — Contenu incorrect

| Spécification v1.0 | Implémentation actuelle | Écart |
|-------------------|-------------------------|-------|
| **"Sécurisez votre facturation et votre POS."** | "Sécurisez vos factures.<br>Prouvez votre conformité.<br>Dormez tranquille." | ❌ **CRITIQUE** — Contenu complètement différent |

**Impact :** Élevé — Message principal incorrect, utilise "conformité" (interdit)

---

### 2. H2 — Absent

| Spécification v1.0 | Implémentation actuelle | Écart |
|-------------------|-------------------------|-------|
| **"Dorevia‑Vault aligne vos opérations avec les exigences de traçabilité attendues par l'administration française."** | Absent | ❌ **CRITIQUE** — H2 manquant |

**Impact :** Élevé — Cadrage réglementaire manquant

---

### 3. Texte explicatif — Contenu incorrect

| Spécification v1.0 | Implémentation actuelle | Écart |
|-------------------|-------------------------|-------|
| "Chaque facture et chaque encaissement sont horodatés, scellés et conservés de manière inaltérable. Vous disposez d'une preuve exploitable en cas de contrôle." | "La plateforme Dorevia-Vault protège automatiquement vos documents financiers grâce à un coffre-fort numérique certifiable."<br><br>"Dorevia-Vault génère automatiquement des preuves cryptographiques opposables pour tous vos documents financiers." | ❌ **CRITIQUE** — Contenu différent, manque "encaissement" et "POS" |

**Impact :** Élevé — Message ne correspond pas à la spec

---

### 4. Accroche process — Absente

| Spécification v1.0 | Implémentation actuelle | Écart |
|-------------------|-------------------------|-------|
| **"Valider · Sceller · Prouver"** | Absent | ❌ **IMPORTANT** — Process manquant |

**Impact :** Moyen — Compréhension rapide manquante

**Note :** Cette accroche existe dans `home/index.html.twig` mais pas dans `landing/index.html.twig`

---

### 5. Micro-copy CTA — Absente

| Spécification v1.0 | Implémentation actuelle | Écart |
|-------------------|-------------------------|-------|
| **"Démonstration personnalisée · Sans engagement"** | Absent | ❌ **IMPORTANT** — Rassurance manquante |

**Impact :** Moyen — Micro-réassurance absente

**Note :** Existe dans `home/index.html.twig` mais pas dans `landing/index.html.twig`

---

### 6. Violation des règles — Mot "conformité"

| Règle spec | Implémentation actuelle | Écart |
|-----------|-------------------------|-------|
| ❌ Ne jamais utiliser « conforme » | "Prouvez votre **conformité**" | ❌ **CRITIQUE** — Violation directe |

**Impact :** Élevé — Violation explicite de la spec

---

## 📋 Comparaison détaillée

### Structure actuelle vs Spec

| Élément | Spec v1.0 | Actuel | Statut |
|---------|-----------|--------|--------|
| **Badge** | (non spécifié) | "🇫🇷 Infrastructure souveraine" | ✅ OK (peut rester) |
| **H1** | "Sécurisez votre facturation et votre POS." | "Sécurisez vos factures. Prouvez votre conformité. Dormez tranquille." | ❌ À remplacer |
| **H2** | "Dorevia‑Vault aligne vos opérations avec les exigences de traçabilité attendues par l'administration française." | Absent | ❌ À ajouter |
| **Texte explicatif** | "Chaque facture et chaque encaissement sont horodatés, scellés et conservés de manière inaltérable. Vous disposez d'une preuve exploitable en cas de contrôle." | 2 paragraphes différents | ❌ À remplacer |
| **Accroche process** | "Valider · Sceller · Prouver" | Absent | ❌ À ajouter |
| **CTA primaire** | (non spécifié) | "➡️ Demander une démo" | ✅ OK |
| **CTA secondaire** | (non spécifié) | "➡️ Calculer mon coût" | ✅ OK |
| **Micro-copy CTA** | "Démonstration personnalisée · Sans engagement" | Absent | ❌ À ajouter |

---

## 💡 Plan de correction

### Phase 1 — Corrections critiques (P0)

#### 1. Remplacer le H1

**Avant :**
```html
<h1 class="ud-hero-title" style="color: white;">
    Sécurisez vos factures.<br>
    Prouvez votre conformité.<br>
    Dormez tranquille.
</h1>
```

**Après :**
```html
<h1 class="ud-hero-title" style="color: white;">
    Sécurisez votre facturation et votre POS.
</h1>
```

---

#### 2. Ajouter le H2

**À ajouter après le H1 :**
```html
<h2 class="ud-hero-subtitle" style="color: rgba(255, 255, 255, 0.95); font-size: clamp(1.25rem, 2vw, 1.5rem); font-weight: 500; margin-bottom: 1.5rem; line-height: 1.6;">
    Dorevia‑Vault aligne vos opérations avec les exigences de traçabilité attendues par l'administration française.
</h2>
```

---

#### 3. Remplacer le texte explicatif

**Avant :**
```html
<p class="ud-hero-desc" style="color: rgba(255, 255, 255, 0.9);">
    La plateforme Dorevia-Vault protège automatiquement vos documents financiers grâce à un coffre-fort numérique certifiable.
</p>
<p style="color: rgba(255, 255, 255, 0.85); margin-top: 1rem;">
    Dorevia-Vault génère automatiquement des preuves cryptographiques opposables pour tous vos documents financiers.
</p>
```

**Après :**
```html
<p class="ud-hero-desc" style="color: rgba(255, 255, 255, 0.9); font-size: clamp(1rem, 1.2vw, 1.125rem); line-height: 1.7;">
    Chaque facture et chaque encaissement sont horodatés, scellés<br>
    et conservés de manière inaltérable.<br>
    Vous disposez d'une preuve exploitable en cas de contrôle.
</p>
```

---

### Phase 2 — Améliorations importantes (P1)

#### 4. Ajouter l'accroche process

**À ajouter après le texte explicatif :**
```html
<p class="hero-signature" style="color: rgba(255, 255, 255, 0.95); font-size: clamp(1.1rem, 1.4vw, 1.3rem); font-weight: 700; margin: 1.5rem 0; letter-spacing: 0.05em;">
    Valider · Sceller · Prouver
</p>
```

---

#### 5. Ajouter la micro-copy CTA

**À ajouter après les boutons CTA :**
```html
<p class="hero-micro-reassurance" style="color: rgba(255, 255, 255, 0.72); margin-top: 1rem; font-size: clamp(0.85rem, 0.95vw, 0.9rem); text-align: center;">
    Démonstration personnalisée · Sans engagement
</p>
```

---

## ✅ Checklist de conformité

### Contenu
- [ ] H1 : "Sécurisez votre facturation et votre POS."
- [ ] H2 : "Dorevia‑Vault aligne vos opérations avec les exigences de traçabilité attendues par l'administration française."
- [ ] Texte explicatif : "Chaque facture et chaque encaissement sont horodatés, scellés et conservés de manière inaltérable. Vous disposez d'une preuve exploitable en cas de contrôle."
- [ ] Accroche process : "Valider · Sceller · Prouver"
- [ ] Micro-copy CTA : "Démonstration personnalisée · Sans engagement"

### Règles
- [ ] Aucun mot "conforme" / "conformité"
- [ ] Pas de jargon réglementaire (NF525, LNE)
- [ ] Pas de jargon juridique
- [ ] Mots clés mis en valeur : sécurisez, traçabilité, preuve

### UI
- [ ] Hero = 100vh (menu inclus)
- [ ] Typo forte sur H1
- [ ] CTA primaire visible immédiatement

---

## 📊 Score de conformité

| Catégorie | Score | Commentaire |
|-----------|-------|-------------|
| **H1** | 0% | Contenu complètement différent |
| **H2** | 0% | Absent |
| **Texte explicatif** | 0% | Contenu différent |
| **Accroche process** | 0% | Absent |
| **Micro-copy CTA** | 0% | Absent |
| **Respect des règles** | 0% | Utilise "conformité" (interdit) |
| **Structure UI** | 100% | Hero 100vh, typo forte, CTA visible |

**Score global :** 14% ❌

---

## 🚀 Recommandation

**Action immédiate requise :** La spécification v1.0 est **FIGÉ et validée**, mais l'implémentation actuelle ne correspond **pas du tout** à la spec.

**Priorité :** P0 — Corrections critiques à appliquer immédiatement.

**Temps estimé :** 30 minutes pour appliquer toutes les corrections.

---

## 📝 Notes

1. **Template `home/index.html.twig`** : Contient déjà "Valider · Sceller · Prouver" et la micro-copy, mais le H1 est différent ("La preuve que vos factures sont conformes" — viole aussi la spec)

2. **Template `landing/index.html.twig`** : Template principal à corriger selon la spec v1.0

3. **Cohérence** : S'assurer que les deux templates utilisent le même contenu validé

---

**Fin de l'évaluation**
