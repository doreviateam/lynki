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
            
            // Gestion de hidden dynamique
            const detail = card.querySelector('.status-card-detail');
            if (detail) {
                detail.removeAttribute('hidden');
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
            
            // Gestion de hidden dynamique avec transition
            const detail = card.querySelector('.status-card-detail');
            if (detail) {
                // Attendre la fin de la transition avant d'ajouter hidden
                detail.addEventListener('transitionend', function addHidden(e) {
                    if (e.propertyName === 'max-height' && !card.classList.contains('is-open')) {
                        detail.setAttribute('hidden', true);
                        detail.removeEventListener('transitionend', addHidden);
                    }
                }, { once: true });
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

        // Fermer les cartes si on clique en dehors (optionnel, désactivé par défaut)
        // document.addEventListener('click', function(e) {
        //     if (!e.target.closest('.status-card')) {
        //         closeAllCards();
        //     }
        // });
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
