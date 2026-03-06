/**
 * Bouton WhatsApp - Dorevia-Vault v1.1
 * Gestion des messages contextuels, disponibilité, tracking
 */

(function() {
    'use strict';

    // Configuration - Récupérer depuis data attribute
    const button = document.querySelector('.whatsapp-button');
    if (!button) return;
    
    const WHATSAPP_NUMBER = button.getAttribute('data-whatsapp-number') || '594690123456';
    const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

    // Messages contextuels selon la page
    const MESSAGES = {
        'home': 'Bonjour, je viens du site Dorevia-Vault.',
        'pricing': 'Bonjour, j\'aimerais connaître vos tarifs.',
        'contact': 'Bonjour, je souhaite vous contacter.',
        'default': 'Bonjour, je viens du site Dorevia-Vault. J\'aimerais en savoir plus.'
    };

    // Heures ouvrables (heure locale Guadeloupe)
    const BUSINESS_HOURS = {
        weekdays: { start: 9, end: 18 }, // Lundi-Vendredi 9h-18h
        saturday: { start: 9, end: 12 }, // Samedi 9h-12h
        sunday: null // Dimanche fermé
    };

    // Détecter la page actuelle
    function getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path.includes('home')) return 'home';
        if (path.includes('pricing')) return 'pricing';
        if (path.includes('contact')) return 'contact';
        return 'default';
    }

    // Obtenir le message contextuel
    function getContextualMessage() {
        const page = getCurrentPage();
        return MESSAGES[page] || MESSAGES.default;
    }

    // Vérifier si on est dans les heures ouvrables
    function isBusinessHours() {
        const now = new Date();
        const day = now.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
        const hour = now.getHours();

        // Dimanche : fermé
        if (day === 0) {
            return false;
        }

        // Samedi : 9h-12h
        if (day === 6) {
            return hour >= BUSINESS_HOURS.saturday.start && hour < BUSINESS_HOURS.saturday.end;
        }

        // Lundi-Vendredi : 9h-18h
        return hour >= BUSINESS_HOURS.weekdays.start && hour < BUSINESS_HOURS.weekdays.end;
    }

    // Mettre à jour le badge de disponibilité
    function updateAvailabilityBadge() {
        const badge = document.querySelector('.whatsapp-availability');
        if (!badge) return;

        if (isBusinessHours()) {
            badge.classList.remove('offline');
            badge.setAttribute('aria-label', 'En ligne');
        } else {
            badge.classList.add('offline');
            badge.setAttribute('aria-label', 'Hors ligne - Réponse sous 24h');
        }
    }

    // Construire l'URL WhatsApp avec message pré-rempli
    function buildWhatsAppURL() {
        const message = encodeURIComponent(getContextualMessage());
        return `${WHATSAPP_BASE_URL}?text=${message}`;
    }

    // Tracking
    function trackEvent(eventName, additionalData = {}) {
        const data = {
            event: eventName,
            page: window.location.pathname,
            message: getContextualMessage(),
            timestamp: new Date().toISOString(),
            ...additionalData
        };

        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'WhatsApp',
                event_label: data.page,
                value: 1
            });
        }

        // Matomo
        if (typeof _paq !== 'undefined') {
            _paq.push(['trackEvent', 'WhatsApp', eventName, data.page]);
        }

        // Console pour debug (à retirer en production)
        console.log('WhatsApp Event:', data);
    }

    // Initialisation
    function init() {
        if (!button) return;

        // Mettre à jour le badge de disponibilité
        updateAvailabilityBadge();
        // Vérifier toutes les heures
        setInterval(updateAvailabilityBadge, 60000); // Toutes les minutes

        // Construire l'URL avec message contextuel
        const url = buildWhatsAppURL();
        button.setAttribute('href', url);

        // Tracking : bouton affiché
        trackEvent('whatsapp_button_viewed');

        // Gestion du clic
        button.addEventListener('click', function(e) {
            trackEvent('whatsapp_button_clicked', {
                is_business_hours: isBusinessHours(),
                message: getContextualMessage()
            });
        });

        // Animation pulse après 5s d'inactivité
        let idleTimer;
        let isIdle = false;

        function resetIdleTimer() {
            clearTimeout(idleTimer);
            if (isIdle) {
                button.classList.remove('idle');
                isIdle = false;
            }
            idleTimer = setTimeout(function() {
                if (!isIdle) {
                    button.classList.add('idle');
                    isIdle = true;
                }
            }, 5000);
        }

        // Réinitialiser le timer sur interaction
        ['mousemove', 'scroll', 'keydown', 'touchstart'].forEach(function(event) {
            document.addEventListener(event, resetIdleTimer, { passive: true });
        });

        resetIdleTimer();
    }

    // Attendre le chargement du DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
