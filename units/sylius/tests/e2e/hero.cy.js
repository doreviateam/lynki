/**
 * Tests E2E Cypress - Hero Dorevia-Vault v1.7
 * 
 * Prérequis : Cypress installé et configuré
 * Installation : npm install --save-dev cypress
 * Lancement : npx cypress open
 */

describe('Hero Section - Dorevia-Vault', () => {
    const baseUrl = Cypress.env('BASE_URL') || 'http://localhost:8000';
    
    beforeEach(() => {
        cy.visit(`${baseUrl}/accueil`);
    });

    describe('Visibilité et structure', () => {
        it('Le Hero est visible au chargement', () => {
            cy.get('.ud-hero').should('be.visible');
        });

        it('Menu + Hero = 100vh (pas de scroll initial)', () => {
            cy.viewport(1440, 900);
            cy.get('body').then(($body) => {
                const bodyHeight = $body[0].scrollHeight;
                const viewportHeight = Cypress.config('viewportHeight') || 900;
                expect(bodyHeight).to.be.at.most(viewportHeight + 10); // Tolérance de 10px
            });
        });

        it('Le header est fixe', () => {
            cy.get('.ud-header').should('have.css', 'position', 'fixed');
        });

        it('Le Hero a le fond bleu correct', () => {
            cy.get('.ud-hero').should('have.css', 'background-color', 'rgb(47, 87, 215)');
        });
    });

    describe('Contenu éditorial', () => {
        it('Le badge "Infrastructure souveraine" est présent', () => {
            cy.get('.hero-badge').should('contain', 'Infrastructure souveraine');
        });

        it('Le nom produit "Dorevia-Vault" est présent', () => {
            cy.get('.hero-product-name').should('contain', 'Dorevia-Vault');
        });

        it('Le H1 contient "La preuve que vos factures sont conformes"', () => {
            cy.get('.ud-hero-title').should('contain', 'La preuve que vos factures sont');
            cy.get('.ud-hero-title .highlight').should('contain', 'conformes');
        });

        it('Le sous-titre est présent', () => {
            cy.get('.hero-desc').should('contain', 'Pour les entreprises');
        });

        it('Les CTA sont présents et cliquables', () => {
            cy.get('.hero-cta-primary').should('be.visible').and('contain', 'Demander une démo');
            cy.get('.hero-cta-secondary').should('be.visible').and('contain', 'Voir comment ça marche');
        });

        it('La micro-réassurance est présente', () => {
            cy.get('.hero-micro-reassurance').should('contain', 'Démonstration personnalisée');
        });
    });

    describe('Schéma visuel (3 cards)', () => {
        it('Les 3 cards sont présentes', () => {
            cy.get('.schema-card').should('have.length', 3);
        });

        it('Les badges numérotés (1, 2, 3) sont présents', () => {
            cy.get('.step-badge').should('have.length', 3);
            cy.get('.step-badge').eq(0).should('contain', '1');
            cy.get('.step-badge').eq(1).should('contain', '2');
            cy.get('.step-badge').eq(2).should('contain', '3');
        });

        it('Les cards contiennent le bon contenu', () => {
            cy.get('.schema-card').eq(0).should('contain', 'ERP');
            cy.get('.schema-card').eq(1).should('contain', 'Dorevia‑Vault');
            cy.get('.schema-card').eq(2).should('contain', 'Preuve générée');
        });

        it('Les cards ont un effet hover', () => {
            cy.get('.schema-card').first().trigger('mouseenter');
            cy.get('.schema-card').first().should('have.css', 'transform');
        });
    });

    describe('Responsive', () => {
        it('Mobile : CTA full width', () => {
            cy.viewport(375, 667);
            cy.get('.ud-hero-buttons').should('have.css', 'flex-direction', 'column');
            cy.get('.ud-hero-buttons .ud-main-btn').should('have.css', 'width', '100%');
        });

        it('Mobile : Cards empilées', () => {
            cy.viewport(375, 667);
            cy.get('.hero-schema').should('have.css', 'flex-direction', 'column');
        });

        it('Mobile : Texte centré', () => {
            cy.viewport(375, 667);
            cy.get('.ud-hero-content').should('have.css', 'text-align', 'center');
        });

        it('Desktop : Layout 2 colonnes', () => {
            cy.viewport(1440, 900);
            cy.get('.ud-hero .row').should('be.visible');
            cy.get('.col-lg-6').should('have.length.at.least', 2);
        });
    });

    describe('Accessibilité', () => {
        it('Les CTA ont des ARIA labels', () => {
            cy.get('.hero-cta-primary').should('have.attr', 'aria-label');
            cy.get('.hero-cta-secondary').should('have.attr', 'aria-label');
        });

        it('Le schéma a un aria-label', () => {
            cy.get('.hero-schema').should('have.attr', 'aria-label');
        });

        it('Les étapes ont des sr-only', () => {
            cy.get('.sr-only').should('have.length.at.least', 3);
        });

        it('Focus visible sur les CTA', () => {
            cy.get('.hero-cta-primary').focus();
            cy.get('.hero-cta-primary').should('have.css', 'outline-width', '3px');
        });
    });

    describe('Performance', () => {
        it('Le CSS hero.css est chargé', () => {
            cy.get('link[href*="hero.css"]').should('exist');
        });

        it('Le JS hero.js est chargé', () => {
            cy.get('script[src*="hero.js"]').should('exist');
        });

        it('Pas de styles inline sur les éléments principaux', () => {
            cy.get('.hero-badge').should('not.have.attr', 'style');
            cy.get('.hero-product-name').should('not.have.attr', 'style');
            cy.get('.ud-hero-title').should('not.have.attr', 'style');
        });
    });

    describe('Interactions', () => {
        it('Le CTA primaire redirige vers contact', () => {
            cy.get('.hero-cta-primary').should('have.attr', 'href').and('include', 'contact');
        });

        it('Le CTA secondaire redirige vers #how-it-works', () => {
            cy.get('.hero-cta-secondary').should('have.attr', 'href', '#how-it-works');
        });

        it('Le scroll fonctionne après le Hero', () => {
            cy.scrollTo(0, 1000);
            cy.get('.ud-hero').should('not.be.inViewport');
        });
    });

    describe('v1.8 — Détails au survol/tap', () => {
        it('La signature "Valider · Sceller · Prouver" est présente', () => {
            cy.get('.hero-signature').should('contain', 'Valider · Sceller · Prouver');
        });

        it('Les cartes ont la nouvelle structure avec boutons', () => {
            cy.get('.schema-card-summary[data-card-toggle]').should('have.length', 3);
        });

        it('Les détails sont cachés par défaut', () => {
            cy.get('.schema-card-detail').should('have.css', 'opacity', '0');
        });

        describe('Desktop hover', () => {
            beforeEach(() => {
                cy.viewport(1440, 900);
            });

            it('Le détail apparaît au survol (desktop)', () => {
                cy.get('.schema-card').first().trigger('mouseenter');
                cy.get('.schema-card').first().find('.schema-card-detail')
                    .should('have.css', 'opacity', '1');
            });

            it('Le focus clavier affiche le détail', () => {
                cy.get('.schema-card-summary').first().focus();
                cy.get('.schema-card').first().find('.schema-card-detail')
                    .should('have.css', 'opacity', '1');
            });
        });

        describe('Mobile tap', () => {
            beforeEach(() => {
                cy.viewport(375, 667);
            });

            it('Le tap ouvre le détail (mobile)', () => {
                cy.get('.schema-card').first().find('[data-card-toggle]').click();
                cy.get('.schema-card').first().should('have.class', 'is-open');
                cy.get('.schema-card').first().find('[data-card-toggle]')
                    .should('have.attr', 'aria-expanded', 'true');
            });

            it('Un seul détail ouvert à la fois (mobile)', () => {
                cy.get('.schema-card').first().find('[data-card-toggle]').click();
                cy.get('.schema-card').eq(1).find('[data-card-toggle]').click();
                cy.get('.schema-card').first().should('not.have.class', 'is-open');
                cy.get('.schema-card').eq(1).should('have.class', 'is-open');
            });

            it('Le toggle ferme le détail si déjà ouvert', () => {
                cy.get('.schema-card').first().find('[data-card-toggle]').click();
                cy.get('.schema-card').first().should('have.class', 'is-open');
                cy.get('.schema-card').first().find('[data-card-toggle]').click();
                cy.get('.schema-card').first().should('not.have.class', 'is-open');
            });
        });

        describe('Accessibilité', () => {
            it('Les boutons ont aria-expanded', () => {
                cy.get('[data-card-toggle]').each(($btn) => {
                    cy.wrap($btn).should('have.attr', 'aria-expanded');
                });
            });

            it('Les boutons ont aria-controls', () => {
                cy.get('[data-card-toggle]').each(($btn) => {
                    cy.wrap($btn).should('have.attr', 'aria-controls');
                });
            });

            it('Les détails ont role="region"', () => {
                cy.get('.schema-card-detail').should('have.attr', 'role', 'region');
            });

            it('Navigation clavier fonctionne (Enter/Space)', () => {
                cy.get('.schema-card-summary').first().focus();
                cy.get('.schema-card-summary').first().type('{enter}');
                cy.get('.schema-card').first().should('have.class', 'is-open');
            });
        });

        describe('Contenu des cartes v1.8', () => {
            it('Carte 1 : Titre "Valider"', () => {
                cy.get('.schema-card[data-card="validate"] .schema-card-title')
                    .should('contain', 'Valider');
            });

            it('Carte 2 : Titre "Sceller"', () => {
                cy.get('.schema-card[data-card="seal"] .schema-card-title')
                    .should('contain', 'Sceller');
            });

            it('Carte 3 : Titre "Prouver"', () => {
                cy.get('.schema-card[data-card="prove"] .schema-card-title')
                    .should('contain', 'Prouver');
            });

            it('Carte 3 est mise en avant (is-primary)', () => {
                cy.get('.schema-card[data-card="prove"]').should('have.class', 'is-primary');
            });

            it('Les détails contiennent les bonnes informations', () => {
                cy.get('.schema-card[data-card="validate"] .schema-card-detail')
                    .should('contain', 'Facture validée');
                cy.get('.schema-card[data-card="seal"] .schema-card-detail')
                    .should('contain', 'Empreinte (hash) calculée');
                cy.get('.schema-card[data-card="prove"] .schema-card-detail')
                    .should('contain', 'Preuve vérifiable');
            });
        });
    });
});
