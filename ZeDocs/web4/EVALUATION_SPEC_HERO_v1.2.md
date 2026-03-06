# 📊 Évaluation — SPEC Hero Dorevia-Vault v1.2 (VALIDÉE)

**Date :** 2026-01-19  
**Évaluateur :** Auto (IA)  
**Version spec :** v1.2 (VALIDÉE)  
**Template analysé :** `home/index.html.twig`

---

## 🔄 Changements majeurs v1.1 → v1.2

| Élément | v1.1 | v1.2 | Changement |
|---------|------|------|------------|
| **Marque dans Hero** | "Dorevia-Vault" comme élément séparé | ❌ Supprimé (sauf dans baseline) | ✅ Simplification |
| **Texte explicatif** | "Chaque facture et chaque encaissement..." | ❌ Supprimé | ✅ Simplification |
| **Mantra** | "Valider · Sceller · Prouver" | ❌ Supprimé | ✅ Simplification |
| **Sous-texte technique** | Optionnel | ❌ Supprimé | ✅ Simplification |
| **Micro-copy CTA** | "Démonstration personnalisée · Sans engagement" | ❌ Supprimé | ✅ Simplification |
| **Badge** | "🇫🇷 Infrastructure souveraine" | "Infrastructure souveraine" (sans drapeau ?) | ⚠️ À clarifier |

---

## 🔴 Écarts identifiés avec l'implémentation actuelle

### 1. Marque "Dorevia-Vault" — À supprimer

| Spécification v1.2 | Implémentation actuelle | Écart |
|-------------------|-------------------------|-------|
| ❌ Pas de marque séparée dans Hero | `<p class="hero-product-name">Dorevia-Vault</p>` présent | ❌ **CRITIQUE** — À supprimer |

**Impact :** Élevé — Simplification du Hero, focus sur la promesse

---

### 2. Texte explicatif — À supprimer

| Spécification v1.2 | Implémentation actuelle | Écart |
|-------------------|-------------------------|-------|
| ❌ Supprimé | "Chaque facture et chaque encaissement sont horodatés, scellés et conservés de manière inaltérable. Vous disposez d'une preuve exploitable en cas de contrôle." présent | ❌ **IMPORTANT** — À supprimer |

**Impact :** Moyen — Simplification, message plus direct

---

### 3. Mantra "Valider · Sceller · Prouver" — À supprimer

| Spécification v1.2 | Implémentation actuelle | Écart |
|-------------------|-------------------------|-------|
| ❌ Supprimé | "Valider · Sceller · Prouver" présent | ❌ **IMPORTANT** — À supprimer |

**Impact :** Moyen — Simplification du Hero

---

### 4. Sous-texte technique — À supprimer

| Spécification v1.2 | Implémentation actuelle | Écart |
|-------------------|-------------------------|-------|
| ❌ Supprimé | "Événements : validation · paiement · réconciliation · écriture comptable" présent | ❌ **IMPORTANT** — À supprimer |

**Impact :** Faible — Élément optionnel, suppression logique

---

### 5. Micro-copy CTA — À supprimer

| Spécification v1.2 | Implémentation actuelle | Écart |
|-------------------|-------------------------|-------|
| ❌ Supprimé | "Démonstration personnalisée · Sans engagement" présent | ❌ **IMPORTANT** — À supprimer |

**Impact :** Faible — Simplification

---

### 6. Badge — À clarifier

| Spécification v1.2 | Implémentation actuelle | Écart |
|-------------------|-------------------------|-------|
| "Infrastructure souveraine" (sans drapeau ?) | "🇫🇷 Infrastructure souveraine" | ⚠️ **À clarifier** — Garder le drapeau ? |

**Impact :** Faible — Le drapeau ajoute de la valeur visuelle

---

## ✅ Points conformes

1. ✅ **H1** : "Sécurisez votre facturation et votre POS." — Conforme
2. ✅ **Baseline (H2)** : "Dorevia‑Vault aligne votre système comptable et votre caisse avec les exigences de traçabilité attendues par l'administration française." — Conforme
3. ✅ **CTA primaire** : "👉 Demander une démo" — Conforme
4. ✅ **CTA secondaire** : "Voir comment ça marche" — Conforme

---

## 📋 Plan de correction

### Phase 1 — Suppressions (P0)

#### 1. Supprimer la marque "Dorevia-Vault"

**À supprimer :**
```html
<p class="hero-product-name">
    Dorevia-Vault
</p>
```

---

#### 2. Supprimer le texte explicatif

**À supprimer :**
```html
<p class="hero-description">
    Chaque facture et chaque encaissement sont horodatés, scellés<br>
    et conservés de manière inaltérable.<br>
    Vous disposez d'une preuve exploitable en cas de contrôle.
</p>
```

---

#### 3. Supprimer le mantra

**À supprimer :**
```html
<p class="hero-signature">
    Valider · Sceller · Prouver
</p>
```

---

#### 4. Supprimer le sous-texte technique

**À supprimer :**
```html
<p class="hero-event-based">
    Événements : validation · paiement · réconciliation · écriture comptable
</p>
```

---

#### 5. Supprimer la micro-copy CTA

**À supprimer :**
```html
<p class="hero-micro-reassurance">
    Démonstration personnalisée · Sans engagement
</p>
```

---

## 📊 Structure finale attendue (v1.2)

```html
<section class="ud-hero" id="home">
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-hero-content">
                    <!-- Badge -->
                    <span class="tag hero-badge">
                        🇫🇷 Infrastructure souveraine
                    </span>

                    <!-- H1 -->
                    <h1 class="ud-hero-title">
                        Sécurisez votre facturation et votre POS.
                    </h1>

                    <!-- Baseline (H2) -->
                    <h2 class="ud-hero-subtitle hero-desc">
                        Dorevia‑Vault aligne votre système comptable et votre caisse
                        avec les exigences de traçabilité attendues par l'administration française.
                    </h2>

                    <!-- CTA -->
                    <div class="ud-hero-buttons">
                        <a href="#contact" class="ud-main-btn ud-white-btn">
                            👉 Demander une démo
                        </a>
                        <a href="#how-it-works" class="ud-main-btn ud-link-btn">
                            Voir comment ça marche
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

---

## ✅ Checklist de conformité v1.2

### Structure
- [ ] Badge : "Infrastructure souveraine" (avec ou sans drapeau ?)
- [ ] Pas de marque "Dorevia-Vault" séparée
- [ ] H1 : "Sécurisez votre facturation et votre POS."
- [ ] Baseline (H2) : "Dorevia‑Vault aligne votre système comptable et votre caisse avec les exigences de traçabilité attendues par l'administration française."
- [ ] Pas de texte explicatif détaillé
- [ ] Pas de mantra "Valider · Sceller · Prouver"
- [ ] Pas de sous-texte technique
- [ ] CTA primaire : "👉 Demander une démo"
- [ ] CTA secondaire : "Voir comment ça marche"
- [ ] Pas de micro-copy CTA

### Règles éditoriales
- [x] Pas de "conforme" / "conformité"
- [x] Pas de NF525, LNE
- [x] Pas de jargon technique
- [x] Message clair et direct

---

## 📊 Score de conformité

| Catégorie | Score | Commentaire |
|-----------|-------|-------------|
| **Structure** | 40% | 5 éléments à supprimer |
| **H1** | 100% | Conforme |
| **Baseline (H2)** | 100% | Conforme |
| **CTAs** | 100% | Conformes |
| **Règles éditoriales** | 100% | Respectées |

**Score global :** 68% ❌

---

## 🚀 Action requise

**Priorité :** P0 — Suppressions pour conformité v1.2

**Temps estimé :** 10 minutes

**Impact :** Élevé — Simplification majeure du Hero, focus sur la promesse

---

**Fin de l'évaluation**
