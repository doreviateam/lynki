/**
 * Hero Analytics & Lazy Loading - Dorevia-Vault v1.7
 * Tracking scroll et lazy loading des sections
 */

(function() {
    'use strict';

    /**
     * Intersection Observer pour lazy loading et tracking scroll
     */
    let scrollObserver;
    let scrollDepthTracked = {
        25: false,
        50: false,
        75: false,
        100: false
    };

    /**
     * Initialiser le lazy loading des sections
     */
    function initLazyLoading() {
        // Observer pour les sections en dehors du viewport
        const lazySections = document.querySelectorAll('section:not(.ud-hero)');
        
        if ('IntersectionObserver' in window) {
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('section-loaded');
                        lazyObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px' // Charger 50px avant d'entrer dans le viewport
            });

            lazySections.forEach(section => {
                lazyObserver.observe(section);
            });
        } else {
            // Fallback pour navigateurs sans IntersectionObserver
            lazySections.forEach(section => {
                section.classList.add('section-loaded');
            });
        }
    }

    /**
     * Calculer le pourcentage de scroll
     */
    function getScrollDepth() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollableHeight = documentHeight - windowHeight;
        
        if (scrollableHeight <= 0) return 0;
        
        return Math.round((scrollTop / scrollableHeight) * 100);
    }

    /**
     * Tracker le scroll depth
     */
    function trackScrollDepth() {
        const depth = getScrollDepth();
        
        // Tracker les milestones (25%, 50%, 75%, 100%)
        Object.keys(scrollDepthTracked).forEach(milestone => {
            const milestoneNum = parseInt(milestone);
            if (depth >= milestoneNum && !scrollDepthTracked[milestone]) {
                scrollDepthTracked[milestone] = true;
                
                if (typeof trackEvent === 'function') {
                    trackEvent('Scroll', 'depth', `scroll_${milestone}`, depth);
                }
                
                // Log pour debug (à retirer en production si nécessaire)
                if (window.console && console.log) {
                    console.log(`Scroll depth tracked: ${milestone}%`);
                }
            }
        });
    }

    /**
     * Tracker la visibilité des sections
     */
    function initSectionTracking() {
        const sections = document.querySelectorAll('section[id]');
        
        if ('IntersectionObserver' in window) {
            scrollObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sectionId = entry.target.id;
                        const sectionName = entry.target.className || sectionId;
                        
                        if (typeof trackEvent === 'function') {
                            trackEvent('Section', 'view', sectionName, 1);
                        }
                    }
                });
            }, {
                rootMargin: '-20% 0px -20% 0px', // Section considérée visible quand 60% visible
                threshold: 0.6
            });

            sections.forEach(section => {
                scrollObserver.observe(section);
            });
        }
    }

    /**
     * Debounce function
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
     * Initialisation
     */
    function init() {
        // Lazy loading
        initLazyLoading();
        
        // Section tracking
        initSectionTracking();
        
        // Scroll depth tracking avec debounce
        let lastScrollDepth = 0;
        window.addEventListener('scroll', debounce(() => {
            const currentDepth = getScrollDepth();
            if (Math.abs(currentDepth - lastScrollDepth) >= 5) { // Tracker seulement si changement significatif
                trackScrollDepth();
                lastScrollDepth = currentDepth;
            }
        }, 200));
        
        // Tracker le temps passé sur le Hero
        let heroViewStart = Date.now();
        const heroSection = document.querySelector('.ud-hero');
        
        if (heroSection) {
            const heroObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) {
                        const timeSpent = Date.now() - heroViewStart;
                        if (typeof trackEvent === 'function' && timeSpent > 2000) { // Minimum 2 secondes
                            trackEvent('Hero', 'time', 'time_spent', Math.round(timeSpent / 1000));
                        }
                    } else {
                        heroViewStart = Date.now();
                    }
                });
            }, {
                threshold: 0.5
            });
            
            heroObserver.observe(heroSection);
        }
    }

    // Démarrer quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
