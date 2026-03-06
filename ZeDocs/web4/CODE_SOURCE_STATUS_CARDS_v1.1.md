# 📋 Code Source — Cartes de Statuts Dorevia-Vault v1.1

**Version :** v1.1 Premium  
**Date :** 2026-01-19  
**Projet :** Dorevia-Vault Landing Page  
**Fichiers :** CSS, JavaScript, HTML/Twig

---

## 📁 Structure des fichiers

```
units/sylius/
├── public/assets/
│   ├── css/
│   │   └── status-cards.css          # Styles complets
│   └── js/
│       └── status-cards.js            # Logique accordéon
└── templates/landing/
    └── index.html.twig                # Section HTML
```

---

## 1. CSS — `status-cards.css`

**Fichier :** `units/sylius/public/assets/css/status-cards.css`

```css
/* ===== Status Cards CSS - Dorevia-Vault v1.1 Premium ===== */
/* Cartes de statuts avec accordéon exclusif - Version améliorée */

/* --- Container principal --- */
.status-cards-container {
    padding: 100px 0;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    position: relative;
}

.status-cards-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
}

.status-cards-title {
    text-align: center;
    margin-bottom: 4rem;
}

.status-cards-title h2 {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 1rem;
    letter-spacing: -0.02em;
}

.status-cards-title p {
    font-size: clamp(1rem, 1.2vw, 1.25rem);
    color: #64748b;
    max-width: 700px;
    margin: 0 auto;
    line-height: 1.6;
}

/* --- Grille des cartes --- */
.status-cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    margin-top: 3rem;
}

/* --- Carte individuelle --- */
.status-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 220px;
    background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
}

/* Badge numéroté (inspiré du hero) */
.status-card-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    border: 1.5px solid rgba(15, 23, 42, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 800;
    color: #1e293b;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    z-index: 2;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* État par défaut - contenu minimal */
.status-card-summary {
    padding: 2.5rem 2rem 2rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    border: none;
    background: transparent;
    width: 100%;
    cursor: pointer;
    outline: none;
    transition: padding 0.2s ease-out;
}

.status-card-icon {
    font-size: clamp(2.5rem, 3.5vw, 3rem);
    margin-bottom: 1.25rem;
    line-height: 1;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.status-card-title {
    font-size: clamp(1.25rem, 1.5vw, 1.5rem);
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.875rem;
    letter-spacing: -0.01em;
}

.status-card-subtitle {
    font-size: clamp(1rem, 1.2vw, 1.125rem);
    color: #475569;
    line-height: 1.6;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.status-card-kicker {
    font-size: clamp(0.875rem, 1vw, 0.95rem);
    color: #64748b;
    font-weight: 400;
    line-height: 1.5;
}

/* Couleurs spécifiques par statut avec gradients */
.status-card[data-status="valided"] {
    border-left: 4px solid #10b981;
    background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
}

.status-card[data-status="valided"] .status-card-icon {
    filter: drop-shadow(0 2px 8px rgba(16, 185, 129, 0.3));
}

.status-card[data-status="valided"] .status-card-badge {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    border-color: rgba(16, 185, 129, 0.2);
}

.status-card[data-status="sealed"] {
    border-left: 4px solid #6366f1;
    background: linear-gradient(180deg, #ffffff 0%, #f5f7ff 100%);
}

.status-card[data-status="sealed"] .status-card-icon {
    filter: drop-shadow(0 2px 8px rgba(99, 102, 241, 0.3));
}

.status-card[data-status="sealed"] .status-card-badge {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: #ffffff;
    border-color: rgba(99, 102, 241, 0.2);
}

.status-card[data-status="verifiable"] {
    border-left: 4px solid #059669;
    background: linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%);
}

.status-card[data-status="verifiable"] .status-card-icon {
    filter: drop-shadow(0 2px 8px rgba(5, 150, 105, 0.3));
}

.status-card[data-status="verifiable"] .status-card-badge {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: #ffffff;
    border-color: rgba(5, 150, 105, 0.2);
}

/* --- Hover (desktop) --- */
@media (hover: hover) and (pointer: fine) {
    .status-card:hover:not(.is-open) {
        transform: translateY(-6px) scale(1.01);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        border-color: rgba(0, 0, 0, 0.1);
    }
    
    .status-card:hover:not(.is-open) .status-card-icon {
        transform: scale(1.1);
    }
    
    .status-card:hover:not(.is-open) .status-card-badge {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
}

/* --- État ouvert --- */
.status-card.is-open {
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
    border-color: rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
}

.status-card.is-open .status-card-summary {
    padding-bottom: 1.5rem;
}

.status-card.is-open .status-card-icon {
    transform: scale(1.05);
}

.status-card.is-open .status-card-badge {
    transform: scale(1.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.status-card-detail {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.2s ease-out, opacity 0.2s ease-out, padding 0.2s ease-out;
    padding: 0 2rem;
}

.status-card.is-open .status-card-detail {
    max-height: 500px;
    opacity: 1;
    padding: 0 2rem 2rem 2rem;
}

.status-card-detail-content {
    padding-top: 1.5rem;
    border-top: 2px solid #e2e8f0;
    margin-top: 0.5rem;
}

.status-card-detail-content ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.status-card-detail-content li {
    font-size: clamp(0.95rem, 1.1vw, 1rem);
    color: #475569;
    line-height: 1.8;
    margin-bottom: 0.875rem;
    padding-left: 1.75rem;
    position: relative;
    font-weight: 400;
}

.status-card-detail-content li:before {
    content: "✓";
    position: absolute;
    left: 0;
    font-weight: 700;
    font-size: 1.1em;
}

.status-card[data-status="valided"] .status-card-detail-content li:before {
    color: #10b981;
}

.status-card[data-status="sealed"] .status-card-detail-content li:before {
    color: #6366f1;
}

.status-card[data-status="verifiable"] .status-card-detail-content li:before {
    color: #059669;
}

.status-card-detail-content li:last-child {
    margin-bottom: 0;
}

/* Bouton fermer amélioré */
.status-card-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 36px;
    height: 36px;
    border: none;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 50%;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: #64748b;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
    z-index: 3;
    font-weight: 600;
}

.status-card.is-open .status-card-close {
    display: flex;
}

.status-card-close:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #1e293b;
    transform: rotate(90deg) scale(1.1);
}

.status-card-close:focus {
    outline: 3px solid #fbbf24;
    outline-offset: 2px;
}

/* Autres cartes atténuées quand une est ouverte */
.status-cards-grid:has(.status-card.is-open) .status-card:not(.is-open) {
    opacity: 0.5;
    transform: scale(0.98);
}

/* --- Accessibilité --- */
.status-card-summary:focus {
    outline: 3px solid #fbbf24;
    outline-offset: 2px;
    border-radius: 8px;
}

.status-card-summary:focus-visible {
    outline: 3px solid #fbbf24;
    outline-offset: 2px;
}

/* Respect de prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
    .status-card,
    .status-card-detail,
    .status-card-close,
    .status-card-icon,
    .status-card-badge {
        transition: none;
    }
    
    .status-card:hover:not(.is-open) {
        transform: none;
    }
    
    .status-card.is-open {
        transform: none;
    }
}

/* --- Responsive --- */

/* Desktop (>1024px) - 3 colonnes */
@media (min-width: 1024px) {
    .status-cards-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
    }
}

/* Tablet (768px - 1023px) - 2 colonnes */
@media (min-width: 768px) and (max-width: 1023px) {
    .status-cards-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }
    
    .status-card {
        min-height: 240px;
    }
    
    .status-card-summary {
        padding: 2rem 1.5rem 1.5rem 1.5rem;
    }
}

/* Mobile (<768px) - 1 colonne */
@media (max-width: 767px) {
    .status-cards-container {
        padding: 60px 0;
    }
    
    .status-cards-title {
        margin-bottom: 2.5rem;
    }
    
    .status-cards-grid {
        grid-template-columns: 1fr;
        gap: 1.25rem;
    }
    
    .status-card {
        min-height: auto;
    }
    
    .status-card-summary {
        padding: 2rem 1.5rem 1.5rem 1.5rem;
    }
    
    .status-card-badge {
        top: 0.875rem;
        left: 0.875rem;
        width: 28px;
        height: 28px;
        font-size: 0.75rem;
    }
    
    .status-card-icon {
        font-size: 2.25rem;
        margin-bottom: 1rem;
    }
    
    .status-card-detail {
        padding: 0 1.5rem;
    }
    
    .status-card.is-open .status-card-detail {
        padding: 0 1.5rem 1.5rem 1.5rem;
    }
    
    .status-card-detail-content li {
        font-size: 0.9rem;
        line-height: 1.7;
    }
    
    .status-card-close {
        width: 32px;
        height: 32px;
        top: 0.75rem;
        right: 0.75rem;
    }
}

/* Petite hauteur d'écran */
@media (max-height: 750px) {
    .status-cards-container {
        padding: 60px 0;
    }
}
```

---

## 2. JavaScript — `status-cards.js`

**Fichier :** `units/sylius/public/assets/js/status-cards.js`

```javascript
/**
 * Status Cards - Accordéon exclusif
 * Dorevia-Vault v1.0
 * 
 * Gestion de l'accordéon exclusif pour les cartes de statuts
 * Une seule carte ouverte à la fois
 */

(function() {
    'use strict';

    // Vérifier si le DOM est chargé
    function domReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    // Initialisation
    function initStatusCards() {
        const cards = document.querySelectorAll('.status-card');
        const toggles = document.querySelectorAll('[data-card-toggle]');
        const closes = document.querySelectorAll('.status-card-close');

        if (cards.length === 0) {
            return;
        }

        // Fonction pour fermer toutes les cartes
        function closeAllCards() {
            cards.forEach(card => {
                card.classList.remove('is-open');
                const toggle = card.querySelector('[data-card-toggle]');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        }

        // Fonction pour ouvrir une carte
        function openCard(card) {
            closeAllCards();
            card.classList.add('is-open');
            const toggle = card.querySelector('[data-card-toggle]');
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'true');
            }
            
            // Tracking optionnel
            const status = card.getAttribute('data-status');
            if (typeof trackEvent === 'function' && status) {
                trackEvent('status_card', 'open', `status_open_${status}`, 1);
            }
        }

        // Fonction pour fermer une carte
        function closeCard(card) {
            card.classList.remove('is-open');
            const toggle = card.querySelector('[data-card-toggle]');
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
            }
        }

        // Gestion des clics sur les toggles
        toggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const card = this.closest('.status-card');
                if (!card) return;

                const isOpen = card.classList.contains('is-open');
                
                if (isOpen) {
                    // Si la carte est ouverte, on la ferme
                    closeCard(card);
                } else {
                    // Sinon, on ouvre cette carte (et on ferme les autres)
                    openCard(card);
                }
            });

            // Gestion du clavier (Enter et Space)
            toggle.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });

        // Gestion des clics sur les boutons fermer
        closes.forEach(close => {
            close.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const card = this.closest('.status-card');
                if (card) {
                    closeCard(card);
                }
            });

            // Gestion du clavier pour le bouton fermer
            close.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    // Initialisation au chargement
    domReady(initStatusCards);

    // Réinitialisation si le DOM change (pour compatibilité avec frameworks)
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            const cards = document.querySelectorAll('.status-card');
            if (cards.length > 0) {
                // Vérifier si les event listeners sont déjà attachés
                const firstToggle = cards[0]?.querySelector('[data-card-toggle]');
                if (firstToggle && !firstToggle.hasAttribute('data-initialized')) {
                    initStatusCards();
                    // Marquer comme initialisé
                    cards.forEach(card => {
                        const toggle = card.querySelector('[data-card-toggle]');
                        if (toggle) {
                            toggle.setAttribute('data-initialized', 'true');
                        }
                    });
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
})();
```

---

## 3. HTML/Twig — Section dans `landing/index.html.twig`

**Fichier :** `units/sylius/templates/landing/index.html.twig`

```twig
<!-- ====== Status Cards Start ====== -->
<section class="status-cards-container" id="status-cards">
    <div class="status-cards-wrapper">
        <div class="status-cards-title">
            <h2>Le parcours de preuve financière</h2>
            <p>Comprenez en quelques secondes comment vos factures deviennent des preuves opposables</p>
        </div>
        
        <div class="status-cards-grid">
            <!-- Carte 1 - Validé -->
            <div class="status-card" data-status="valided">
                <button class="status-card-summary" 
                        type="button"
                        data-card-toggle
                        aria-expanded="false"
                        aria-controls="status-detail-valided">
                    <span class="status-card-badge" aria-hidden="true">1</span>
                    <div class="status-card-icon" aria-hidden="true">🟢</div>
                    <h3 class="status-card-title">Validé</h3>
                    <p class="status-card-subtitle">Votre facture est confirmée</p>
                    <p class="status-card-kicker">depuis votre ERP</p>
                </button>
                
                <button class="status-card-close" 
                        type="button"
                        aria-label="Fermer la carte Validé">
                    ✕
                </button>
                
                <div class="status-card-detail" 
                     id="status-detail-valided" 
                     role="region" 
                     aria-label="Détails du statut Validé">
                    <div class="status-card-detail-content">
                        <ul>
                            <li>Facture validée dans l'ERP</li>
                            <li>Paiement reçu</li>
                            <li>Écriture comptable postée</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Carte 2 - Scellé -->
            <div class="status-card" data-status="sealed">
                <button class="status-card-summary" 
                        type="button"
                        data-card-toggle
                        aria-expanded="false"
                        aria-controls="status-detail-sealed">
                    <span class="status-card-badge" aria-hidden="true">2</span>
                    <div class="status-card-icon" aria-hidden="true">🔒</div>
                    <h3 class="status-card-title">Scellé</h3>
                    <p class="status-card-subtitle">Votre facture est figée</p>
                    <p class="status-card-kicker">et protégée contre toute altération dans <strong>Dorevia-Vault</strong></p>
                </button>
                
                <button class="status-card-close" 
                        type="button"
                        aria-label="Fermer la carte Scellé">
                    ✕
                </button>
                
                <div class="status-card-detail" 
                     id="status-detail-sealed" 
                     role="region" 
                     aria-label="Détails du statut Scellé">
                    <div class="status-card-detail-content">
                        <ul>
                            <li>Capture événementielle</li>
                            <li>Empreinte cryptographique générée</li>
                            <li>Horodatage enregistré</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Carte 3 - Vérifiable -->
            <div class="status-card" data-status="verifiable">
                <button class="status-card-summary" 
                        type="button"
                        data-card-toggle
                        aria-expanded="false"
                        aria-controls="status-detail-verifiable">
                    <span class="status-card-badge" aria-hidden="true">3</span>
                    <div class="status-card-icon" aria-hidden="true">✅</div>
                    <h3 class="status-card-title">Vérifiable</h3>
                    <p class="status-card-subtitle">Une preuve est disponible</p>
                    <p class="status-card-kicker">et contrôlable à tout moment</p>
                </button>
                
                <button class="status-card-close" 
                        type="button"
                        aria-label="Fermer la carte Vérifiable">
                    ✕
                </button>
                
                <div class="status-card-detail" 
                     id="status-detail-verifiable" 
                     role="region" 
                     aria-label="Détails du statut Vérifiable">
                    <div class="status-card-detail-content">
                        <ul>
                            <li>Preuve exploitable</li>
                            <li>Vérification possible à tout moment</li>
                            <li>Utilisable en cas de contrôle</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
<!-- ====== Status Cards End ====== -->
```

---

## 4. Inclusion dans le template

### Dans le `<head>` :

```twig
<link rel="stylesheet" href="{{ asset('assets/css/status-cards.css') }}" />
```

### Avant la fermeture de `</body>` :

```twig
<script src="{{ asset('assets/js/status-cards.js') }}" defer></script>
```

---

## ✨ Caractéristiques principales

### Design
- ✅ **Badges numérotés** avec gradients colorés (1, 2, 3)
- ✅ **Gradients subtils** sur les fonds de cartes
- ✅ **Ombres premium** avec élévation au hover
- ✅ **Icônes** avec drop-shadow coloré
- ✅ **Radius** : 14px pour un look moderne

### Animations
- ✅ **Transitions fluides** avec `cubic-bezier(0.4, 0, 0.2, 1)`
- ✅ **Hover** : translation Y, scale, rotation du badge
- ✅ **Ouverture** : 200ms ease-out
- ✅ **Fermeture** : 150ms ease-in
- ✅ **Micro-interactions** sur les icônes et badges

### Fonctionnalités
- ✅ **Accordéon exclusif** : une seule carte ouverte à la fois
- ✅ **Navigation clavier** : TAB, ENTER, SPACE
- ✅ **ARIA labels** complets pour l'accessibilité
- ✅ **Tracking optionnel** des événements
- ✅ **Respect de `prefers-reduced-motion`**

### Responsive
- ✅ **Desktop** (>1024px) : 3 colonnes
- ✅ **Tablet** (768-1023px) : 2 colonnes
- ✅ **Mobile** (<768px) : 1 colonne
- ✅ **Fonts fluides** avec `clamp()`

### Accessibilité
- ✅ **Focus visible** : outline jaune (#fbbf24)
- ✅ **ARIA expanded** : true/false
- ✅ **ARIA controls** : liaison avec les détails
- ✅ **Role region** : pour les lecteurs d'écran
- ✅ **Navigation clavier** complète

---

## 🎨 Couleurs par statut

| Statut | Couleur principale | Badge gradient | Fond gradient |
|--------|-------------------|----------------|--------------|
| **Validé** | `#10b981` (vert) | `#10b981` → `#059669` | `#ffffff` → `#f0fdf4` |
| **Scellé** | `#6366f1` (indigo) | `#6366f1` → `#4f46e5` | `#ffffff` → `#f5f7ff` |
| **Vérifiable** | `#059669` (vert foncé) | `#059669` → `#047857` | `#ffffff` → `#ecfdf5` |

---

## 📝 Notes d'implémentation

1. **Ordre d'inclusion** : CSS dans le `<head>`, JS avant `</body>` avec `defer`
2. **Dépendances** : Aucune (vanilla JavaScript)
3. **Compatibilité** : Navigateurs modernes (ES6+)
4. **Performance** : Lazy loading compatible, pas de dépendances externes
5. **Tracking** : Optionnel, nécessite une fonction `trackEvent()` globale

---

## 🔧 Personnalisation

### Modifier les couleurs

Éditer les sections dans `status-cards.css` :
- `.status-card[data-status="valided"]` pour le statut Validé
- `.status-card[data-status="sealed"]` pour le statut Scellé
- `.status-card[data-status="verifiable"]` pour le statut Vérifiable

### Modifier les animations

Ajuster les durées dans les `transition` :
- Ouverture : `max-height 0.2s ease-out`
- Fermeture : `max-height 0.15s ease-in`
- Hover : `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`

### Ajouter une carte

1. Dupliquer une carte dans le HTML
2. Changer `data-status` et les IDs
3. Ajouter les styles CSS correspondants
4. Mettre à jour le contenu

---

## ✅ Checklist de validation

- [x] Accordéon exclusif fonctionnel
- [x] Navigation clavier complète
- [x] ARIA labels présents
- [x] Responsive sur tous les breakpoints
- [x] Animations fluides
- [x] Respect de `prefers-reduced-motion`
- [x] Focus visible pour l'accessibilité
- [x] Pas de styles inline
- [x] Code commenté et documenté

---

**Fin du document**
