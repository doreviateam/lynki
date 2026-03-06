(function () {
  "use strict";

  // ======= Sticky
  window.onscroll = function () {
    const ud_header = document.querySelector(".ud-header");
    if (!ud_header) return;
    
    const sticky = ud_header.offsetTop;
    const logo = document.querySelector(".navbar-brand img");

    if (window.pageYOffset > sticky) {
      ud_header.classList.add("sticky");
    } else {
      ud_header.classList.remove("sticky");
    }

    // === logo change (seulement si le logo existe)
    if (logo) {
      if (ud_header.classList.contains("sticky")) {
        logo.src = "assets/images/logo/logo-2.svg";
      } else {
        logo.src = "assets/images/logo/logo.svg";
      }
    }

    // show or hide the back-top-top button
    const backToTop = document.querySelector(".back-to-top");
    if (backToTop) {
      if (
        document.body.scrollTop > 50 ||
        document.documentElement.scrollTop > 50
      ) {
        backToTop.style.display = "flex";
      } else {
        backToTop.style.display = "none";
      }
    }
  };

  //===== close navbar-collapse when a  clicked
  let navbarToggler = document.querySelector(".navbar-toggler");
  const navbarCollapse = document.querySelector(".navbar-collapse");

  if (navbarToggler && navbarCollapse) {
    document.querySelectorAll(".ud-menu-scroll").forEach((e) =>
      e.addEventListener("click", () => {
        navbarToggler.classList.remove("active");
        navbarCollapse.classList.remove("show");
      })
    );
    navbarToggler.addEventListener("click", function () {
      navbarToggler.classList.toggle("active");
      navbarCollapse.classList.toggle("show");
    });
  }

  // ===== submenu avec gestion unifiée et stable
  // Menu toujours visible - pas besoin de gérer le header
  (function initSubmenus() {
    const submenuButton = document.querySelectorAll(".nav-item-has-children");
    const submenuTimeouts = new Map(); // Un timeout par menu pour éviter les conflits
    
    submenuButton.forEach((elem) => {
      const link = elem.querySelector("a");
      const submenu = elem.querySelector(".ud-submenu");
      
      if (!link || !submenu) return;
      
      // Initialiser le timeout pour ce menu spécifique
      submenuTimeouts.set(elem, null);
      
      // Fonction pour annuler le timeout de fermeture
      const cancelClose = () => {
        const timeout = submenuTimeouts.get(elem);
        if (timeout) {
          clearTimeout(timeout);
          submenuTimeouts.set(elem, null);
        }
        submenu.classList.add("show");
      };
      
      // Fonction pour programmer la fermeture
      const scheduleClose = () => {
        const timeout = submenuTimeouts.get(elem);
        if (timeout) {
          clearTimeout(timeout);
        }
        const newTimeout = setTimeout(() => {
          submenu.classList.remove("show");
          submenuTimeouts.set(elem, null);
        }, 500); // 500ms de délai
        submenuTimeouts.set(elem, newTimeout);
      };
      
      // Survol de l'élément parent : ouvrir
      elem.addEventListener("mouseenter", cancelClose, { passive: true });
      
      // Survol du sous-menu lui-même : garder ouvert
      submenu.addEventListener("mouseenter", cancelClose, { passive: true });
      
      // Sortie de l'élément parent : programmer fermeture
      elem.addEventListener("mouseleave", scheduleClose, { passive: true });
      
      // Sortie du sous-menu : programmer fermeture
      submenu.addEventListener("mouseleave", scheduleClose, { passive: true });
      
      // Clic sur mobile/tablette
      if (window.innerWidth < 992) {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Fermer tous les autres menus
          submenuButton.forEach(otherElem => {
            if (otherElem !== elem) {
              const otherSubmenu = otherElem.querySelector(".ud-submenu");
              if (otherSubmenu) {
                otherSubmenu.classList.remove("show");
              }
            }
          });
          // Toggle ce menu
          submenu.classList.toggle("show");
        }, { once: false });
      }
    });
  })();

  // ===== wow js
  new WOW().init();

  // ====== scroll top js
  function scrollTo(element, to = 0, duration = 500) {
    const start = element.scrollTop;
    const change = to - start;
    const increment = 20;
    let currentTime = 0;

    const animateScroll = () => {
      currentTime += increment;

      const val = Math.easeInOutQuad(currentTime, start, change, duration);

      element.scrollTop = val;

      if (currentTime < duration) {
        setTimeout(animateScroll, increment);
      }
    };

    animateScroll();
  }

  Math.easeInOutQuad = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  };

  const backToTopButton = document.querySelector(".back-to-top");
  if (backToTopButton) {
    backToTopButton.onclick = () => {
      scrollTo(document.documentElement);
    };
  }
})();
