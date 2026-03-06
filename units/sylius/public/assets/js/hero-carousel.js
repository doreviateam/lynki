/**
 * Hero Carousel - Dorevia-Vault v1.1
 * SPEC : HERO Carrousel "Vérité financière" v1.1
 * 
 * Fonctionnalités :
 * - Rotation automatique avec timing adaptatif
 * - Navigation dots et flèches
 * - Swipe mobile
 * - Pause au hover/interaction
 * - Accessibilité (clavier, ARIA)
 * - Analytics intégrés
 */

(function() {
    'use strict';

    class HeroCarousel {
        constructor(container) {
            this.container = container;
            this.slides = container.querySelectorAll('.hero-carousel-slide');
            this.dots = container.querySelectorAll('.hero-carousel-dot');
            this.arrows = {
                prev: container.querySelector('.hero-carousel-arrow-prev'),
                next: container.querySelector('.hero-carousel-arrow-next')
            };
            
            this.currentSlide = 0;
            this.totalSlides = this.slides.length;
            this.autoRotateTimer = null;
            this.initialPauseTimer = null;
            this.isPaused = false;
            this.isInitialPause = true;
            
            // Timing par slide (en ms)
            this.slideDurations = [];
            this.slides.forEach(slide => {
                const duration = parseInt(slide.dataset.duration) || 7000;
                this.slideDurations.push(duration);
            });
            
            // Swipe mobile
            this.touchStartX = 0;
            this.touchEndX = 0;
            this.swipeThreshold = 50;
            
            this.init();
        }

        init() {
            // Pause initiale de 3 secondes
            this.initialPauseTimer = setTimeout(() => {
                this.isInitialPause = false;
                this.startAutoRotate();
            }, 3000);

            // Event listeners
            this.setupEventListeners();
            
            // Track slide view initial
            this.trackSlideView(0);
        }

        setupEventListeners() {
            // Dots navigation
            this.dots.forEach((dot, index) => {
                dot.addEventListener('click', () => this.goToSlide(index));
                dot.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.goToSlide(index);
                    }
                });
            });

            // Arrow navigation
            if (this.arrows.prev) {
                this.arrows.prev.addEventListener('click', () => this.prevSlide());
            }
            if (this.arrows.next) {
                this.arrows.next.addEventListener('click', () => this.nextSlide());
            }

            // Keyboard navigation
            this.container.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.prevSlide();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.nextSlide();
                }
            });

            // Pause au hover/focus
            this.container.addEventListener('mouseenter', () => this.pause());
            this.container.addEventListener('mouseleave', () => this.resume());
            this.container.addEventListener('focusin', () => this.pause());
            this.container.addEventListener('focusout', () => this.resume());

            // Swipe mobile
            this.container.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            this.container.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
            }, { passive: true });

            // CTA clicks tracking
            const ctas = this.container.querySelectorAll('.hero-cta');
            ctas.forEach(cta => {
                cta.addEventListener('click', () => {
                    this.trackCTAClick(this.currentSlide);
                });
            });
        }

        goToSlide(index) {
            if (index < 0 || index >= this.totalSlides) return;
            if (index === this.currentSlide) return;

            // Track navigation click
            this.trackNavClick(this.currentSlide, index);

            // Update slides
            this.slides[this.currentSlide].classList.remove('active');
            this.slides[index].classList.add('active');

            // Update dots
            this.dots[this.currentSlide].classList.remove('active');
            this.dots[this.currentSlide].setAttribute('aria-selected', 'false');
            this.dots[this.currentSlide].setAttribute('tabindex', '-1');
            
            this.dots[index].classList.add('active');
            this.dots[index].setAttribute('aria-selected', 'true');
            this.dots[index].setAttribute('tabindex', '0');
            this.dots[index].focus();

            // Update current slide
            this.currentSlide = index;

            // Track slide view
            this.trackSlideView(index);

            // Restart auto-rotate
            this.restartAutoRotate();
        }

        nextSlide() {
            const next = (this.currentSlide + 1) % this.totalSlides;
            this.goToSlide(next);
        }

        prevSlide() {
            const prev = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
            this.goToSlide(prev);
        }

        startAutoRotate() {
            if (this.isPaused || this.isInitialPause) return;
            
            this.autoRotateTimer = setTimeout(() => {
                this.nextSlide();
                this.startAutoRotate();
            }, this.slideDurations[this.currentSlide]);
        }

        restartAutoRotate() {
            this.stopAutoRotate();
            if (!this.isPaused && !this.isInitialPause) {
                this.startAutoRotate();
            }
        }

        stopAutoRotate() {
            if (this.autoRotateTimer) {
                clearTimeout(this.autoRotateTimer);
                this.autoRotateTimer = null;
            }
        }

        pause() {
            this.isPaused = true;
            this.stopAutoRotate();
            this.container.classList.add('paused');
        }

        resume() {
            this.isPaused = false;
            if (!this.isInitialPause) {
                this.startAutoRotate();
            }
            this.container.classList.remove('paused');
        }

        handleSwipe() {
            const diff = this.touchStartX - this.touchEndX;
            
            if (Math.abs(diff) > this.swipeThreshold) {
                if (diff > 0) {
                    // Swipe gauche → slide suivant
                    this.nextSlide();
                } else {
                    // Swipe droite → slide précédent
                    this.prevSlide();
                }
            }
        }

        trackSlideView(slideIndex) {
            if (typeof trackEvent === 'function') {
                const slideTitle = this.slides[slideIndex].querySelector('.hero-carousel-title')?.textContent?.trim() || '';
                trackEvent('Hero', 'slide_view', `slide_${slideIndex + 1}`, slideIndex + 1);
            }
        }

        trackCTAClick(slideIndex) {
            if (typeof trackEvent === 'function') {
                trackEvent('Hero', 'cta_click', `slide_${slideIndex + 1}_demo`, 1);
            }
        }

        trackNavClick(fromSlide, toSlide) {
            if (typeof trackEvent === 'function') {
                trackEvent('Hero', 'nav_click', `from_${fromSlide + 1}_to_${toSlide + 1}`, toSlide + 1);
            }
        }
    }

    // Initialisation au chargement du DOM
    document.addEventListener('DOMContentLoaded', function() {
        const carouselContainer = document.querySelector('.hero-carousel');
        if (carouselContainer) {
            new HeroCarousel(carouselContainer);
        }
    });

})();
