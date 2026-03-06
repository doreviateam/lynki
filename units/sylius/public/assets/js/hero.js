/**
 * Hero Dorevia-Vault v1.7
 * Gestion de la hauteur du header et tracking des CTA
 */

(function() {
    'use strict';

    /**
     * Mettre à jour la variable CSS --header-h (source unique de vérité)
     */
    function setHeaderHeightVar() {
        const header = document.querySelector('.ud-header');
        if (!header) return;
        
        const headerHeight = header.offsetHeight;
        document.documentElement.style.setProperty('--header-h', headerHeight + 'px');
        
        // Ajouter padding-top au body pour compenser le header fixe
        document.body.style.paddingTop = headerHeight + 'px';
    }

    /**
     * Debounce function pour optimiser les performances
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Initialiser le tracking des CTA
     */
    function initCTATracking() {
        const ctaButtons = document.querySelectorAll('.hero-cta, .ud-hero-buttons a');
        
        ctaButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                // Déterminer l'action selon le href
                let action = 'home_hero_unknown';
                const href = this.getAttribute('href');
                
                if (href && href.includes('contact')) {
                    action = 'home_hero_demo';
                } else if (href && href.includes('#how-it-works')) {
                    action = 'home_hero_how_it_works';
                }
                
                // Tracking
                if (typeof trackEvent === 'function') {
                    trackEvent('CTA', 'click', action, 1);
                }
                
                // Loading state pour les liens externes
                if (href && !href.startsWith('#')) {
                    this.style.opacity = '0.7';
                    this.style.pointerEvents = 'none';
                }
            });
        });
    }

    /**
     * Initialisation
     */
    function init() {
        // Ajuster la hauteur du header ASAP
        setHeaderHeightVar();
        
        // DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setHeaderHeightVar();
                initCTATracking();
            });
        } else {
            setHeaderHeightVar();
            initCTATracking();
        }
        
        // Après chargement complet (fonts/images)
        window.addEventListener('load', setHeaderHeightVar);
        
        // Resize avec debounce
        window.addEventListener('resize', debounce(setHeaderHeightVar, 150));
    }

    // Démarrer
    init();
})();

/**
 * Hero Schema Card Toggle - v1.8
 * Toggle des détails au tap (mobile) et accessibilité clavier
 */
(function() {
    'use strict';

    function initSchemaCardToggle() {
        const cards = Array.from(document.querySelectorAll('.schema-card[data-card]'));
        if (!cards.length) return;

        // Touch devices / small screens
        const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;

        function closeAll(exceptCard) {
            cards.forEach(c => {
                if (c !== exceptCard) {
                    c.classList.remove('is-open');
                    const btn = c.querySelector('[data-card-toggle]');
                    if (btn) btn.setAttribute('aria-expanded', 'false');
                }
            });
        }

        cards.forEach(card => {
            const btn = card.querySelector('[data-card-toggle]');
            if (!btn) return;

            // Click handler (mobile/touch)
            btn.addEventListener('click', () => {
                if (!isTouch) return; // desktop: hover handles it
                const isOpen = card.classList.toggle('is-open');
                btn.setAttribute('aria-expanded', String(isOpen));
                if (isOpen) closeAll(card);
            });

            // Keyboard handler (accessibility)
            btn.addEventListener('keydown', (e) => {
                const key = e.key;
                if (key !== 'Enter' && key !== ' ') return;
                e.preventDefault();
                const isOpen = card.classList.toggle('is-open');
                btn.setAttribute('aria-expanded', String(isOpen));
                if (isOpen) closeAll(card);
            });
        });
    }

    // Initialisation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSchemaCardToggle);
    } else {
        initSchemaCardToggle();
    }
})();
