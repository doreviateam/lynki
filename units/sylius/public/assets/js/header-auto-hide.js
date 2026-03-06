/**
 * Header Auto-Hide
 * Cache le header au scroll down, le réaffiche au scroll up ou au survol du haut
 */

(function() {
    'use strict';

    let lastScrollTop = 0;
    let scrollThreshold = 100; // Seuil de scroll avant d'activer le comportement
    let ticking = false;
    let isMouseNearTop = false;
    let isMenuHovered = false; // Flag pour savoir si on survole un menu
    const header = document.querySelector('.ud-header');

    if (!header) {
        return;
    }

    function handleScroll() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                // Ne pas cacher le header si on est tout en haut de la page
                if (scrollTop < scrollThreshold) {
                    header.classList.remove('hidden');
                    lastScrollTop = scrollTop;
                    ticking = false;
                    return;
                }

                // Ne pas cacher si la souris est près du haut OU si on survole un menu
                const menuHovered = window.isMenuHovered || isMenuHovered;
                if (isMouseNearTop || menuHovered) {
                    lastScrollTop = scrollTop;
                    ticking = false;
                    return;
                }

                // Scroll down : cacher le header (seulement si pas de menu survolé)
                if (scrollTop > lastScrollTop && !menuHovered) {
                    header.classList.add('hidden');
                }
                // Scroll up : afficher le header
                else if (scrollTop < lastScrollTop) {
                    header.classList.remove('hidden');
                }

                lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
                ticking = false;
            });

            ticking = true;
        }
    }

    // Détecter le curseur en haut de l'écran (zone de 100px depuis le haut)
    document.addEventListener('mousemove', function(e) {
        const triggerZone = 100; // Zone de déclenchement en pixels depuis le haut
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const menuHovered = window.isMenuHovered || isMenuHovered;
        
        if (e.clientY <= triggerZone) {
            isMouseNearTop = true;
            header.classList.remove('hidden');
        } else {
            isMouseNearTop = false;
            // Si on est scrollé et que le curseur est en bas, cacher le menu (seulement si pas de menu survolé)
            if (scrollTop > scrollThreshold && !menuHovered) {
                header.classList.add('hidden');
            }
        }
    }, { passive: true });

    // Toujours afficher le header au hover direct
    header.addEventListener('mouseenter', function() {
        isMouseNearTop = true;
        isMenuHovered = true;
        header.classList.remove('hidden');
    });

    header.addEventListener('mouseleave', function(e) {
        // Vérifier si on passe sur un sous-menu
        const relatedTarget = e.relatedTarget;
        if (relatedTarget && (relatedTarget.closest('.ud-submenu') || relatedTarget.closest('.nav-item-has-children'))) {
            // On passe sur un sous-menu, ne pas masquer
            isMouseNearTop = true;
            isMenuHovered = true;
            return;
        }
        // Réinitialiser le flag après un court délai
        setTimeout(() => {
            isMenuHovered = false;
        }, 300);
    });
    
    // Empêcher le header de se cacher quand on survole un menu avec dropdown
    const menuItems = header.querySelectorAll('.nav-item-has-children');
    menuItems.forEach(menuItem => {
        menuItem.addEventListener('mouseenter', function() {
            isMenuHovered = true;
            header.classList.remove('hidden');
        });
        menuItem.addEventListener('mouseleave', function(e) {
            // Vérifier si on passe sur le sous-menu
            const relatedTarget = e.relatedTarget;
            if (relatedTarget && relatedTarget.closest('.ud-submenu')) {
                isMenuHovered = true;
                return;
            }
            // Délai avant de réinitialiser le flag
            setTimeout(() => {
                isMenuHovered = false;
            }, 500);
        });
    });
    
    // Empêcher le header de se cacher quand on survole un sous-menu
    const submenus = header.querySelectorAll('.ud-submenu');
    submenus.forEach(submenu => {
        submenu.addEventListener('mouseenter', function() {
            isMenuHovered = true;
            isMouseNearTop = true;
            header.classList.remove('hidden');
        });
        submenu.addEventListener('mouseleave', function() {
            // Délai avant de réinitialiser le flag
            setTimeout(() => {
                isMenuHovered = false;
            }, 500);
        });
    });

    // Écouter le scroll avec throttling
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Réafficher le header si on touche en haut (pour mobile)
    document.addEventListener('touchstart', function(e) {
        if (e.touches[0].clientY <= 150) {
            header.classList.remove('hidden');
        }
    }, { passive: true });
})();
