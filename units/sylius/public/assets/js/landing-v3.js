/* ===== Landing Page v3.0 — JavaScript principal ===== */
/* Base : SPEC_TECHNIQUE_LANDING_v3.0.md */

(function() {
    'use strict';

    // Initialisation au chargement du DOM
    document.addEventListener('DOMContentLoaded', function() {
        initSmoothScroll();
        initStickyHeader();
        initMobileMenu();
        initAnalytics();
        initScrollTracking();
        initScrollAnimations();
        initActiveNav();
    });

    /* ===== 1. Smooth Scroll ===== */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Ignorer les ancres vides
                if (href === '#' || href === '') {
                    return;
                }

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    
                    // Calculer la position avec offset pour le header sticky
                    const headerHeight = document.querySelector('.ud-header')?.offsetHeight || 85;
                    let targetPosition;
                    
                    // Si c'est une sous-section (row avec id), prendre le parent section
                    if (target.classList.contains('row') && target.id) {
                        const section = target.closest('section');
                        if (section) {
                            targetPosition = section.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                        } else {
                            targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                        }
                    } else {
                        targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                    }
                    
                    window.scrollTo({
                        top: Math.max(0, targetPosition),
                        behavior: 'smooth'
                    });

                    // Mettre à jour l'URL sans déclencher de scroll
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                    
                    // Fermer le menu mobile si ouvert
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    const navbarToggler = document.querySelector('.navbar-toggler');
                    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                        navbarCollapse.classList.remove('show');
                        if (navbarToggler) {
                            navbarToggler.classList.remove('active');
                        }
                    }
                }
            });
        });
    }

    /* ===== 2. Active Navigation Item ===== */
    function updateActiveNavItem() {
        const sections = document.querySelectorAll('.ud-section[id], section[id]');
        const navLinks = document.querySelectorAll('.ud-menu-scroll[href^="#"]');
        const headerHeight = document.querySelector('.ud-header')?.offsetHeight || 85;
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const sectionId = section.getAttribute('id');
            
            // Détecter la section visible dans le viewport
            if (sectionTop <= headerHeight + 100 && sectionTop >= -200) {
                currentSection = sectionId;
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href.includes('#' + currentSection)) {
                link.classList.add('active');
            }
        });
    }

    /* ===== 4. Active Navigation on Scroll ===== */
    function initActiveNav() {
        // Mettre à jour au scroll
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateActiveNavItem();
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // Mettre à jour au chargement
        updateActiveNavItem();
    }

    /* ===== 5. Sticky Header (toujours fixe) ===== */
    function initStickyHeader() {
        const header = document.querySelector('.ud-header');
        if (!header) return;

        // Le header est toujours fixe, on ajoute juste la classe sticky pour le style
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            const scrollThreshold = 50;

            if (currentScroll > scrollThreshold) {
                header.classList.add('sticky');
            } else {
                header.classList.remove('sticky');
            }
        }, { passive: true });
        
        // S'assurer que le header est toujours fixe au chargement
        header.classList.add('sticky');
    }

    /* ===== 3. Menu Mobile ===== */
    function initMobileMenu() {
        const toggler = document.querySelector('.navbar-toggler');
        const menu = document.querySelector('.navbar-collapse');
        
        if (!toggler || !menu) return;

        // Vérifier si les événements ne sont pas déjà attachés
        if (toggler.dataset.menuInitialized) return;
        toggler.dataset.menuInitialized = 'true';

        toggler.addEventListener('click', function(e) {
            e.stopPropagation();
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            menu.classList.toggle('show');
        });

        // Fermer le menu au clic sur un lien (sauf les liens de sous-menu)
        const menuLinks = menu.querySelectorAll('.ud-menu-scroll:not(.ud-submenu-link)');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 992) {
                    toggler.setAttribute('aria-expanded', 'false');
                    menu.classList.remove('show');
                }
            });
        });
    }

    /* ===== 4. Analytics Tracking ===== */
    function initAnalytics() {
        // Track CTA clicks
        const ctas = document.querySelectorAll('.hero-cta, .cta-final-primary, .cta-final-secondary');
        ctas.forEach(cta => {
            cta.addEventListener('click', function() {
                const ctaText = this.textContent.trim();
                const ctaType = this.classList.contains('hero-cta-primary') ? 'hero_primary' :
                               this.classList.contains('hero-cta-secondary') ? 'hero_secondary' :
                               this.classList.contains('cta-final-primary') ? 'final_primary' :
                               'final_secondary';

                trackEvent('CTA', 'click', ctaType, 1);
                
                // Track avec label détaillé si fonction trackEvent globale disponible
                if (typeof trackEvent === 'function') {
                    trackEvent('CTA', 'click', ctaText, 1);
                }
            });
        });

        // Track section views (via Intersection Observer dans initScrollTracking)
    }

    /* ===== 5. Scroll Tracking ===== */
    function initScrollTracking() {
        const sections = document.querySelectorAll('section[id]');
        if (sections.length === 0) return;

        // Ajouter la classe section-loaded aux sections déjà visibles au chargement
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                section.classList.add('section-loaded');
            }
        });

        const observerOptions = {
            threshold: 0.1, // Réduit à 0.1 pour déclencher plus tôt
            rootMargin: '50px' // Déclenche 50px avant que la section soit visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    const sectionName = entry.target.getAttribute('aria-label') || sectionId;
                    
                    // Ajouter la classe section-loaded pour le lazy loading CSS
                    entry.target.classList.add('section-loaded');
                    
                    // Track section view
                    if (typeof trackEvent === 'function') {
                        trackEvent('Engagement', 'section_view', sectionName, 1);
                    }
                    
                    // Track scroll depth
                    trackScrollDepth();
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    /* ===== 6. Scroll Depth Tracking ===== */
    function trackScrollDepth() {
        const scrollPercent = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        // Track milestones (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100];
        milestones.forEach(milestone => {
            if (scrollPercent >= milestone && !window[`scrollDepth${milestone}Tracked`]) {
                window[`scrollDepth${milestone}Tracked`] = true;
                
                if (typeof trackEvent === 'function') {
                    trackEvent('Engagement', 'scroll_depth', `${milestone}%`, milestone);
                }
            }
        });
    }

    /* ===== 7. Scroll Animations ===== */
    function initScrollAnimations() {
        // Vérifier si reduced motion est activé
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            return; // Pas d'animations si reduced motion
        }

        const animatedElements = document.querySelectorAll('.ud-section, .card, .challenge-card, .solution-card, .benefit-card');
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    entry.target.classList.add('slide-up');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animatedElements.forEach(element => {
            // Initialiser comme invisible
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            
            observer.observe(element);
        });
    }

    /* ===== 8. Helper function trackEvent ===== */
    function trackEvent(category, action, label = null, value = null) {
        // Utiliser la fonction globale trackEvent si disponible (définie dans layout.html.twig)
        if (typeof window.trackEvent === 'function') {
            window.trackEvent(category, action, label, value);
        } else if (typeof gtag !== 'undefined') {
            // Fallback direct vers gtag
            gtag('event', action, {
                'event_category': category,
                'event_label': label,
                'value': value
            });
        }
    }

})();
