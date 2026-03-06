# 📋 Plan d'Implémentation — Section "Défis" v1.1

**Date :** 21/01/2026  
**Version :** 1.1 (Amendée)  
**Statut :** Prêt à implémenter  

---

## 🎯 Objectif

Refondre la section "Défis" selon la SPEC v1.1 amendée pour :
- Créer plus d'empathie et d'identification
- Mettre l'accent sur le délai et la fragilité (pas l'outil)
- Réduire de 4 à 3 sous-sections
- Améliorer le layout avec message développé en 2 colonnes

---

## 📝 Modifications à apporter

### 1. Structure HTML

**Fichier :** `/opt/dorevia-plateform/units/sylius/templates/home/index.html.twig`

**Changements :**
- Supprimer le kicker "Les défis"
- Changer le titre en "Pourquoi vos chiffres ne sont pas fiables aujourd'hui"
- Ajouter un bloc "Message développé" en 2 colonnes
- Réduire de 4 à 3 cartes
- Ajouter les citations en style blockquote
- Modifier le CTA

### 2. Styles CSS

**Fichier :** `/opt/dorevia-plateform/units/sylius/public/assets/css/landing-v3.css`

**Nouveaux styles à ajouter :**
- `.dv-message-block` : Container flex 2 colonnes
- `.dv-message-text` : Colonne texte
- `.dv-message-visual` : Colonne visuelle
- `.dv-card-quote` : Style pour citations
- `.dv-grid--3` : Grid 3 colonnes
- `.dv-cta-block` : Container CTA

---

## 🔧 Code HTML complet

```html
<!-- ====== Section 2 : Défis du pilotage financier Start ====== -->
<section id="defis-pilotage" class="ud-challenges ud-section dv-section dv-defis" role="region" aria-label="Défis du pilotage financier">
    <div class="container dv-container">
        
        <!-- En-tête de section -->
        <header class="dv-section__head text-center">
            <h2 class="ud-section-title-heading dv-title">Pourquoi vos chiffres ne sont pas fiables aujourd'hui</h2>
        </header>

        <!-- Message développé (2 colonnes sur desktop) -->
        <div class="dv-message-block">
            <div class="dv-message-text">
                <p class="dv-message-intro">
                    Vous avez des outils.<br>
                    Vous avez des équipes.<br>
                    Pourtant, vous doutez encore de vos chiffres.
                </p>
                <p class="dv-message-core">
                    Le problème n'est pas votre ERP.<br>
                    Ce n'est pas votre comptable.<br>
                    C'est <strong>le délai et la fragilité</strong> entre ce qui se passe réellement<br>
                    et ce que vous voyez dans vos tableaux de bord.
                </p>
            </div>
            <div class="dv-message-visual">
                <div class="dv-message-stat">
                    <div class="dv-stat-value">68%</div>
                    <div class="dv-stat-label">des dirigeants doutent de leurs chiffres</div>
                </div>
            </div>
        </div>

        <!-- 3 sous-sections (cartes) -->
        <div class="dv-grid dv-grid--3">
            
            <!-- Carte 1 : Chiffres en retard -->
            <article class="dv-card challenge-card">
                <div class="dv-card__icon challenge-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z"/>
                    </svg>
                </div>
                <h3 class="dv-card__title challenge-title">Vous pilotez avec du retard</h3>
                <p class="dv-card__text challenge-detail">
                    Clôtures mensuelles à J+15, J+30, parfois J+45. Vous prenez des décisions <strong>sur le passé</strong>.
                </p>
                <blockquote class="dv-card-quote">
                    <p>"Vous pilotez en regardant dans le rétroviseur."</p>
                </blockquote>
                <div class="dv-metric challenge-metric">
                    <div class="dv-metric__value metric-value">15–45 jours</div>
                    <div class="dv-metric__label metric-label">délai moyen de disponibilité</div>
                </div>
            </article>

            <!-- Carte 2 : Excel bricolés -->
            <article class="dv-card challenge-card">
                <div class="dv-card__icon challenge-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19V5" stroke-linecap="round"/>
                        <path d="M4 19h16" stroke-linecap="round"/>
                        <path d="M8 15v-4" stroke-linecap="round"/>
                        <path d="M12 15V7" stroke-linecap="round"/>
                        <path d="M16 15v-6" stroke-linecap="round"/>
                    </svg>
                </div>
                <h3 class="dv-card__title challenge-title">Excel est au cœur des processus</h3>
                <p class="dv-card__text challenge-detail">
                    Exports manuels, versions multiples, corrections à la main. Une seule personne détient la "vérité".
                </p>
                <blockquote class="dv-card-quote">
                    <p>"Le moindre départ devient un risque."</p>
                </blockquote>
                <div class="dv-metric challenge-metric">
                    <div class="dv-metric__value metric-value">73%</div>
                    <div class="dv-metric__label metric-label">des PME utilisent encore Excel</div>
                </div>
            </article>

            <!-- Carte 3 : Stress des contrôles -->
            <article class="dv-card challenge-card">
                <div class="dv-card__icon challenge-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" stroke-linejoin="round"/>
                        <path d="M14 2v6h6" stroke-linejoin="round"/>
                        <path d="M8 13h8M8 17h6" stroke-linecap="round"/>
                    </svg>
                </div>
                <h3 class="dv-card__title challenge-title">Les justificatifs restent difficiles à produire</h3>
                <p class="dv-card__text challenge-detail">
                    Impossible de produire une preuve immédiate. Temps perdu à justifier, expliquer, reconstruire.
                </p>
                <blockquote class="dv-card-quote">
                    <p>"Vous subissez au lieu d'anticiper."</p>
                </blockquote>
                <div class="dv-metric challenge-metric">
                    <div class="dv-metric__value metric-value">+10 Md€</div>
                    <div class="dv-metric__label metric-label">de redressements par an</div>
                </div>
            </article>

        </div>

        <!-- CTA vers Solution -->
        <div class="dv-cta-block">
            <a href="#solution" class="dv-btn dv-btn--primary ud-menu-scroll" aria-label="Découvrir la solution Dorevia-Vault">
                Découvrir la solution
            </a>
        </div>

    </div>
</section>
<!-- ====== Section 2 : Défis du pilotage financier End ====== -->
```

---

## 🎨 Code CSS complet

```css
/* ===== Section Défis v1.1 (Amendée) ===== */

.dv-defis {
    padding: 72px 0;
}

.dv-section__head {
    max-width: 900px;
    margin: 0 auto var(--spacing-8) auto;
    text-align: center;
}

.dv-title {
    font-size: clamp(28px, 3vw, 40px);
    line-height: 1.15;
    margin: 0;
    font-weight: var(--font-weight-extrabold);
    color: var(--color-text-primary);
}

/* Message développé (2 colonnes) */
.dv-message-block {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    margin-bottom: var(--spacing-8);
    max-width: 1100px;
    margin-left: auto;
    margin-right: auto;
}

@media (min-width: 992px) {
    .dv-message-block {
        grid-template-columns: 1.6fr 1fr;
        gap: 3rem;
        align-items: center;
    }
}

.dv-message-text {
    font-size: 1.1rem;
    line-height: 1.7;
    color: var(--color-text-primary);
}

.dv-message-intro {
    font-size: 1.15rem;
    font-weight: 500;
    margin: 0 0 1.5rem 0;
    color: var(--color-text-primary);
    line-height: 1.8;
}

.dv-message-core {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.7;
}

.dv-message-core strong {
    color: var(--color-primary);
    font-weight: var(--font-weight-bold);
}

.dv-message-visual {
    display: flex;
    align-items: center;
    justify-content: center;
}

.dv-message-stat {
    text-align: center;
    padding: 2rem;
    background: linear-gradient(135deg, rgba(47, 87, 215, 0.05) 0%, rgba(47, 87, 215, 0.02) 100%);
    border-radius: 16px;
    border: 1px solid var(--color-gray-200);
    min-width: 200px;
}

.dv-stat-value {
    font-size: 3rem;
    font-weight: 800;
    color: var(--color-primary);
    line-height: 1;
    margin-bottom: 0.5rem;
}

.dv-stat-label {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    line-height: 1.4;
}

/* Grid 3 colonnes */
.dv-grid--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1100px) {
    .dv-grid--3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 720px) {
    .dv-grid--3 {
        grid-template-columns: 1fr;
    }
}

/* Citations dans les cartes */
.dv-card-quote {
    margin: 1rem 0;
    padding: 0.75rem 0 0.75rem 1rem;
    border-left: 3px solid var(--color-primary);
    font-style: italic;
    color: var(--color-text-secondary);
    background: rgba(47, 87, 215, 0.03);
    border-radius: 0 8px 8px 0;
}

.dv-card-quote p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
}

/* CTA Block */
.dv-cta-block {
    text-align: center;
    margin-top: var(--spacing-8);
    padding-top: var(--spacing-6);
}

.dv-cta-block .dv-btn {
    font-size: 1.05rem;
    padding: 12px 28px;
}
```

---

## ✅ Checklist d'implémentation

### Phase 1 : Préparation
- [ ] Sauvegarder l'état actuel de la section
- [ ] Vérifier les variables CSS existantes
- [ ] Préparer les icônes SVG si nécessaire

### Phase 2 : HTML
- [ ] Remplacer l'en-tête (supprimer kicker, modifier titre)
- [ ] Ajouter le bloc message développé
- [ ] Réduire de 4 à 3 cartes
- [ ] Ajouter les citations en blockquote
- [ ] Modifier le CTA

### Phase 3 : CSS
- [ ] Ajouter les styles pour `.dv-message-block`
- [ ] Ajouter les styles pour `.dv-message-text` et `.dv-message-visual`
- [ ] Ajouter les styles pour `.dv-card-quote`
- [ ] Modifier `.dv-grid--4` en `.dv-grid--3`
- [ ] Ajouter les styles pour `.dv-cta-block`
- [ ] Tester le responsive

### Phase 4 : Tests
- [ ] Vérifier l'affichage desktop
- [ ] Vérifier l'affichage tablette
- [ ] Vérifier l'affichage mobile
- [ ] Tester les liens (smooth scroll vers #solution)
- [ ] Vérifier l'accessibilité (contraste, aria-labels)
- [ ] Vider le cache Symfony

### Phase 5 : Validation
- [ ] Vérifier que le message développé crée de l'empathie
- [ ] Vérifier que les 3 cartes sont claires
- [ ] Vérifier que les citations sont visibles
- [ ] Vérifier que le CTA est actionnable
- [ ] Valider avec l'équipe produit

---

## 🔄 Différences avec l'actuel

| Élément | Actuel (v1.0) | Nouveau (v1.1) |
|---------|---------------|----------------|
| **Titre** | "Les défis du pilotage financier aujourd'hui" | "Pourquoi vos chiffres ne sont pas fiables aujourd'hui" |
| **Kicker** | "Les défis" | Supprimé |
| **Message développé** | Absent | Ajouté en 2 colonnes |
| **Nombre de cartes** | 4 | 3 |
| **Citations** | Absentes | Ajoutées en blockquote |
| **CTA** | "Découvrir la solution" (dans bridge) | "Découvrir la solution" (bloc dédié) |
| **Layout** | Grid 4 colonnes | Message 2 colonnes + Grid 3 colonnes |

---

## 📊 Métriques de succès

Après implémentation, mesurer :
- Temps passé sur la section (> 10s)
- Taux de scroll jusqu'à la section Solution
- Taux de clic sur le CTA "Découvrir la solution"
- Comparer avec le taux de clic du CTA Hero

---

**Note :** Cette implémentation respecte la SPEC v1.1 amendée et s'intègre harmonieusement avec le design system existant.
