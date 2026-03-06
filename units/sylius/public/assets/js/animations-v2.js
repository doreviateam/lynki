/**
 * Animations V2 - Phase 1 (Obot.ai inspired)
 * Scroll reveal, header scroll detection, smooth scroll
 * Version: 1.0
 * Date: 24 janvier 2026
 */

(function() {
  'use strict';

  // Attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Menu mobile : toujours initialiser (navigation essentielle, pas une animation)
    initMobileMenu();

    // Respecter prefers-reduced-motion pour le reste (reveal, scroll)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    initScrollReveal();
    initHeaderScroll();
    initSmoothScroll();
  }

  /**
   * Scroll reveal avec Intersection Observer
   */
  function initScrollReveal() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-on-scroll');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observer les éléments avec la classe ou les sections par défaut
    const elementsToAnimate = document.querySelectorAll(
      '.section, .v2-section, .hero, .feature-card, .blog-card, .v2-card'
    );

    elementsToAnimate.forEach(el => {
      observer.observe(el);
    });
  }

  /**
   * Détection du scroll pour le header
   */
  function initHeaderScroll() {
    const header = document.querySelector('.v2-header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;

      if (currentScroll > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }, { passive: true });
  }

  /**
   * Smooth scroll pour les liens d'ancrage
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || !href) return;

        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Fermer le menu mobile si ouvert
          const mobileMenu = document.querySelector('.v2-mobile-menu');
          const menuToggle = document.querySelector('.v2-menu-toggle');
          if (mobileMenu && mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });
  }

  /**
   * Menu mobile - ouverture/fermeture
   */
  function initMobileMenu() {
    const menuToggle = document.querySelector('.v2-menu-toggle');
    const mobileMenu = document.querySelector('.v2-mobile-menu');
    
    if (!menuToggle || !mobileMenu) return;

    menuToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        // Fermer
        mobileMenu.classList.remove('active');
        this.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      } else {
        // Ouvrir
        mobileMenu.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    });

    // Fermer le menu au clic sur un lien
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Fermer le menu au clic en dehors
    document.addEventListener('click', function(e) {
      if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        if (mobileMenu.classList.contains('active')) {
          mobileMenu.classList.remove('active');
          menuToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      }
    });

    // Fermer le menu lors du redimensionnement vers desktop
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 768) {
        mobileMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

})();
