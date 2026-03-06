/**
 * Ghost UI — Animations et Interactions
 * Design moderne avec effets glassmorphism et animations subtiles
 */

(function() {
    'use strict';

    // Intersection Observer pour animations au scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Animations désactivées — contenu visible immédiatement
    // Les cartes s'affichent normalement sans animation au scroll

    // Effet parallaxe désactivé — sections se suivent normalement

    // Ajouter particules flottantes dynamiquement
    function createParticles() {
        const sections = document.querySelectorAll('.dv-section');
        sections.forEach(section => {
            for (let i = 0; i < 3; i++) {
                const particle = document.createElement('div');
                particle.className = 'ghost-particle';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 6 + 's';
                section.appendChild(particle);
            }
        });
    }

    // Créer particules après chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createParticles);
    } else {
        createParticles();
    }

    // Skeleton loader : remplacer par contenu réel
    function replaceSkeletons() {
        const skeletons = document.querySelectorAll('.ghost-skeleton');
        skeletons.forEach(skeleton => {
            // Logique pour remplacer le skeleton par le contenu réel
            // À adapter selon vos besoins
        });
    }

    // Support reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.style.setProperty('--transition-base', '0ms');
        document.documentElement.style.setProperty('--transition-slow', '0ms');
    }

})();
