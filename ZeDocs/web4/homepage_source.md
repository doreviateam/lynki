# 📄 Code Source — Homepage Dorevia-Vault

**Fichier** : `units/sylius/templates/home/index.html.twig`  
**Date** : 2026-01-18  
**Version** : v1.3

---

## Structure du fichier

```twig
{% extends 'layout.html.twig' %}

{% block title %}{{ page_title }}{% endblock %}
{% block meta_description %}{{ page_description }}{% endblock %}

{% block stylesheets %}
<!-- Styles CSS inline -->
{% endblock %}

{% block body %}
<!-- Section Hero -->
<!-- Autres sections -->
{% endblock %}
```

---

## Code source complet

```twig
{% extends 'layout.html.twig' %}

{% block title %}{{ page_title }}{% endblock %}
{% block meta_description %}{{ page_description }}{% endblock %}

{% block stylesheets %}
<style>
    .form-message {
        display: none;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
    }
    .form-message.alert-success {
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #10b981;
        display: block;
    }
    .form-message.alert-danger {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #dc2626;
        display: block;
    }
    
    /* Accessibilité : texte pour lecteurs d'écran */
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
    
    /* Hero + Header = 100vh selon spec v1.3 */
    /* Empêcher le scroll initial */
    body {
        overflow-x: hidden;
    }
    
    /* S'assurer que le hero ne dépasse pas */
    #home {
        box-sizing: border-box;
    }
    
    /* Layout 2 colonnes desktop, vertical mobile */
    .ud-hero {
        height: calc(100vh - 85px); /* Utiliser height pour exactement 100vh */
        min-height: calc(100vh - 85px); /* Fallback */
        max-height: calc(100vh - 85px); /* Empêcher dépassement */
        display: flex;
        align-items: center;
        padding-top: 0 !important; /* Surcharge le padding-top du SCSS */
        padding-bottom: 0 !important;
        margin-top: 0;
        margin-bottom: 0;
        overflow: hidden; /* Empêcher le contenu de dépasser */
        box-sizing: border-box;
    }
    
    .ud-hero .container {
        width: 100%;
        height: 100%;
    }
    
    .ud-hero .row {
        height: 100%;
    }
    
    .ud-hero-content {
        text-align: left;
    }
    
    .ud-hero-visual {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .hero-schema {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        flex-wrap: nowrap; /* Desktop : une seule ligne */
    }
    
    .schema-card {
        flex: 0 1 auto; /* Ne pas grandir, peut rétrécir */
        min-width: 180px;
    }
    
    /* Hero responsive selon spec v1.3 */
    @media (max-width: 992px) {
        .ud-hero {
            height: calc(100vh - 75px) !important;
            min-height: calc(100vh - 75px) !important;
            max-height: calc(100vh - 75px) !important;
            padding: 1rem 0 !important;
        }
        
        .ud-hero-content {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .ud-hero-buttons {
            flex-direction: column;
            width: 100%;
        }
        
        .ud-hero-buttons .ud-main-btn {
            width: 100%;
            display: block;
        }
        
        .ud-hero-title {
            font-size: 2rem !important;
            line-height: 1.3 !important;
        }
        
        .hero-schema {
            flex-direction: column;
            flex-wrap: wrap;
            gap: 1.5rem;
        }
        
        .schema-card {
            max-width: 100% !important;
            width: 100%;
            min-width: 100% !important;
        }
        
        .step-badge {
            top: 1rem !important;
            left: 1rem !important;
        }
    }
    
    @media (max-width: 768px) {
        .ud-hero-title {
            font-size: 1.8rem !important;
        }
        
        .ud-hero-desc {
            font-size: 1.1rem !important;
        }
    }
</style>
{% endblock %}

{% block body %}
    <!-- ====== Hero Start ====== -->
    <section class="ud-hero" id="home">
        <div class="container">
            <div class="row align-items-center">
                <!-- Colonne gauche : Contenu -->
                <div class="col-lg-6 col-md-12">
                    <div class="ud-hero-content wow fadeInUp" data-wow-delay=".2s">
                        <!-- 1. Badge de crédibilité -->
                        <span class="tag" style="background: rgba(255, 255, 255, 0.2); color: white; padding: 0.5rem 1rem; border-radius: 2rem; margin-bottom: 1.5rem; display: inline-block; font-size: 0.9rem;">
                            🇫🇷 Infrastructure souveraine française · Programme pilote
                        </span>
                        
                        <!-- 2. Nom produit (visible mais secondaire) -->
                        <div style="margin-bottom: 1rem;">
                            <p style="font-size: 1.2rem; font-weight: 500; color: rgba(255, 255, 255, 0.8); margin: 0; letter-spacing: 0.05em;">
                                Dorevia-Vault
                            </p>
                        </div>
                        
                        <!-- 3. Promesse principale (H1) -->
                        <h1 class="ud-hero-title" style="color: white; font-size: 2.8rem; font-weight: 800; margin: 0 0 1.5rem 0; line-height: 1.2; letter-spacing: -0.02em;">
                            La preuve que vos factures sont <span style="color: #fbbf24;">conformes</span>.
                        </h1>
                        
                        <!-- 4. Cible (sous-titre) -->
                        <p class="ud-hero-desc" style="color: rgba(255, 255, 255, 0.9); font-size: 1.25rem; margin-top: 1.5rem; line-height: 1.6;">
                            Pour les dirigeants de TPE/PME qui veulent être en règle sans stress.
                        </p>
                        
                        <!-- 5. Explication courte -->
                        <p style="color: rgba(255, 255, 255, 0.85); margin-top: 1.5rem; font-size: 1.1rem; line-height: 1.7;">
                            Dorevia-Vault sécurise vos factures depuis votre ERP et génère une preuve vérifiable en cas de contrôle.
                        </p>
                        
                        <!-- 6. CTA -->
                        <div class="ud-hero-buttons" style="margin-top: 2.5rem; display: flex; gap: 1rem; flex-wrap: wrap; padding: 0;">
                            <a href="{{ path('contact') }}" class="ud-main-btn ud-white-btn" onclick="if(typeof trackEvent === 'function') trackEvent('CTA', 'click', 'home_hero_pilot', 1);">
                                🚀 Rejoindre le programme pilote
                            </a>
                            <a href="#how-it-works" class="ud-main-btn ud-link-btn" style="color: white; border: 2px solid rgba(255, 255, 255, 0.5);" onclick="if(typeof trackEvent === 'function') trackEvent('CTA', 'click', 'home_hero_how_it_works', 1);">
                                Voir comment ça marche
                            </a>
                        </div>
                        
                        <!-- 7. Micro-réassurance -->
                        <p style="color: rgba(255, 255, 255, 0.7); margin-top: 1.5rem; font-size: 0.9rem; line-height: 1.5;">
                            Accès early · Démo + onboarding · Sans engagement
                        </p>
                    </div>
                </div>
                
                <!-- Colonne droite : Visuel explicatif -->
                <div class="col-lg-6 col-md-12">
                    <div class="ud-hero-visual wow fadeInUp" data-wow-delay=".4s" style="margin-top: 2rem;">
                        <div class="hero-schema" aria-label="Schéma ERP vers preuve fiscale">
                            <!-- Carte 1 : ERP -->
                            <div class="schema-card" style="background: rgba(255, 255, 255, 0.95); border-radius: 16px; padding: 2rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); text-align: center; position: relative;">
                                <span class="sr-only">Étape 1 : ERP</span>
                                <div class="step-badge" style="position: absolute; top: 1rem; left: 1rem; width: 28px; height: 28px; border-radius: 50%; background: rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 600; color: #1e293b;">1</div>
                                <div style="font-size: 2.5rem; margin-bottom: 1rem;">📊</div>
                                <h3 style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0;">ERP (ex: Odoo)</h3>
                                <p style="font-size: 0.9rem; color: #64748b; margin: 0;">Facture émise</p>
                            </div>
                            
                            <!-- Carte 2 : Dorevia-Vault -->
                            <div class="schema-card" style="background: rgba(255, 255, 255, 0.95); border-radius: 16px; padding: 2rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); text-align: center; position: relative;">
                                <span class="sr-only">Étape 2 : Dorevia-Vault</span>
                                <div class="step-badge" style="position: absolute; top: 1rem; left: 1rem; width: 28px; height: 28px; border-radius: 50%; background: rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 600; color: #1e293b;">2</div>
                                <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔒</div>
                                <h3 style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0;">Dorevia-Vault</h3>
                                <p style="font-size: 0.9rem; color: #64748b; margin: 0;">Capture & scellement</p>
                            </div>
                            
                            <!-- Carte 3 : Preuve -->
                            <div class="schema-card" style="background: rgba(255, 255, 255, 0.95); border-radius: 16px; padding: 2rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); text-align: center; position: relative;">
                                <span class="sr-only">Étape 3 : Preuve générée</span>
                                <div class="step-badge" style="position: absolute; top: 1rem; left: 1rem; width: 28px; height: 28px; border-radius: 50%; background: rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 600; color: #1e293b;">3</div>
                                <div style="font-size: 2.5rem; margin-bottom: 1rem;">✅</div>
                                <h3 style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0;">Preuve générée</h3>
                                <p style="font-size: 0.9rem; color: #64748b; margin: 0;">Hash + horodatage</p>
                                <p style="font-size: 0.85rem; color: #10b981; font-weight: 600; margin: 0.5rem 0 0 0;">Statut : Vérifiable</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- ====== Hero End ====== -->

    <!-- ====== CONTEXTE — Pourquoi maintenant Start ====== -->
    <section class="ud-context" style="padding: 80px 0; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);">
        <div class="container">
            <div class="row">
                <div class="col-lg-10 mx-auto">
                    <div class="ud-section-title mx-auto text-center">
                        <div style="max-width: 800px; margin: 0 auto;">
                            <p style="font-size: 1.25rem; line-height: 1.8; color: #1e293b; margin: 0 0 1.5rem 0;">
                                La réglementation française évolue.<br>
                                Les entreprises doivent désormais<br>
                                pouvoir prouver leurs opérations<br>
                                rapidement et de manière fiable.
                            </p>
                            <div style="margin-top: 2rem; padding: 2rem; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; border-left: 4px solid #f59e0b;">
                                <p style="font-size: 1.1rem; line-height: 1.7; color: #78350f; margin: 0 0 1rem 0;">
                                    Chaque année,
                                </p>
                                <p style="font-size: 2rem; font-weight: 800; color: #b45309; margin: 0 0 1rem 0;">
                                    plus de 10 milliards d'euros
                                </p>
                                <p style="font-size: 1.1rem; line-height: 1.7; color: #78350f; margin: 0;">
                                    sont notifiés lors de contrôles fiscaux,<br>
                                    souvent pour des erreurs involontaires.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- ====== CONTEXTE — Pourquoi maintenant End ====== -->

    <!-- ====== PROBLÈME RÉEL Start ====== -->
    <section class="ud-problem" style="padding: 80px 0; background: #ffffff;">
        <div class="container">
            <div class="row">
                <div class="col-lg-10 mx-auto">
                    <div class="ud-section-title mx-auto text-center">
                        <div style="max-width: 800px; margin: 0 auto;">
                            <p style="font-size: 1.5rem; line-height: 1.8; color: #1e293b; margin: 0 0 2rem 0; font-weight: 600;">
                                Les entrepreneurs honnêtes<br>
                                n'ont pas besoin de plus de complexité.
                            </p>
                            <p style="font-size: 1.25rem; line-height: 1.8; color: #1e293b; margin: 0 0 2rem 0;">
                                Ils ont besoin de :
                            </p>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                                <div style="padding: 1.5rem; background: #f8fafc; border-radius: 12px; text-align: center;">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
                                    <p style="font-size: 1rem; color: #1e293b; margin: 0; font-weight: 600;">Preuves fiables</p>
                                </div>
                                <div style="padding: 1.5rem; background: #f8fafc; border-radius: 12px; text-align: center;">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📄</div>
                                    <p style="font-size: 1rem; color: #1e293b; margin: 0; font-weight: 600;">Documents traçables</p>
                                </div>
                                <div style="padding: 1.5rem; background: #f8fafc; border-radius: 12px; text-align: center;">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
                                    <p style="font-size: 1rem; color: #1e293b; margin: 0; font-weight: 600;">Historique vérifiable</p>
                                </div>
                                <div style="padding: 1.5rem; background: #f8fafc; border-radius: 12px; text-align: center;">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔒</div>
                                    <p style="font-size: 1rem; color: #1e293b; margin: 0; font-weight: 600;">Sécurité dans le temps</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- ====== PROBLÈME RÉEL End ====== -->

    <!-- ====== SOLUTION Start ====== -->
    <section class="ud-solution" style="padding: 80px 0; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);">
        <div class="container">
            <div class="row">
                <div class="col-lg-10 mx-auto">
                    <div class="ud-section-title mx-auto text-center">
                        <div style="max-width: 800px; margin: 0 auto;">
                            <p style="font-size: 1.75rem; line-height: 1.8; color: #1e293b; margin: 0 0 2rem 0; font-weight: 700;">
                                Dorevia‑Vault est une plateforme<br>
                                qui transforme vos factures<br>
                                en preuves opposables.
                            </p>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                                <div style="padding: 1.5rem; background: #ffffff; border-radius: 12px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚡</div>
                                    <p style="font-size: 1rem; color: #1e293b; margin: 0; font-weight: 600;">automatique</p>
                                </div>
                                <div style="padding: 1.5rem; background: #ffffff; border-radius: 12px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔌</div>
                                    <p style="font-size: 1rem; color: #1e293b; margin: 0; font-weight: 600;">sans changer vos outils</p>
                                </div>
                                <div style="padding: 1.5rem; background: #ffffff; border-radius: 12px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📚</div>
                                    <p style="font-size: 1rem; color: #1e293b; margin: 0; font-weight: 600;">sans formation complexe</p>
                                </div>
                                <div style="padding: 1.5rem; background: #ffffff; border-radius: 12px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">💬</div>
                                    <p style="font-size: 1rem; color: #1e293b; margin: 0; font-weight: 600;">sans jargon technique</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- ====== SOLUTION End ====== -->

    <!-- ====== BÉNÉFICES MÉTIER Start ====== -->
    <section id="features" class="ud-features" style="padding: 80px 0; background: #ffffff;">
        <div class="container">
            <div class="row">
                <div class="col-lg-12">
                    <div class="ud-section-title mx-auto text-center">
                        <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: #1e293b;">Bénéfices métier</h2>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-xl-3 col-lg-3 col-sm-6">
                    <div class="ud-single-feature wow fadeInUp" data-wow-delay=".1s">
                        <div class="ud-feature-icon">
                            <i class="lni lni-shield"></i>
                        </div>
                        <div class="ud-feature-content">
                            <h3 class="ud-feature-title">Sérénité</h3>
                            <p class="ud-feature-desc">
                                Vous êtes prêt en cas de contrôle.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-lg-3 col-sm-6">
                    <div class="ud-single-feature wow fadeInUp" data-wow-delay=".15s">
                        <div class="ud-feature-icon">
                            <i class="lni lni-checkmark-circle"></i>
                        </div>
                        <div class="ud-feature-content">
                            <h3 class="ud-feature-title">Crédibilité</h3>
                            <p class="ud-feature-desc">
                                Vous pouvez prouver vos opérations.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-lg-3 col-sm-6">
                    <div class="ud-single-feature wow fadeInUp" data-wow-delay=".2s">
                        <div class="ud-feature-icon">
                            <i class="lni lni-zip"></i>
                        </div>
                        <div class="ud-feature-content">
                            <h3 class="ud-feature-title">Simplicité</h3>
                            <p class="ud-feature-desc">
                                Aucune action manuelle requise.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-lg-3 col-sm-6">
                    <div class="ud-single-feature wow fadeInUp" data-wow-delay=".25s">
                        <div class="ud-feature-icon">
                            <i class="lni lni-checkmark-circle"></i>
                        </div>
                        <div class="ud-feature-content">
                            <h3 class="ud-feature-title">Conformité</h3>
                            <p class="ud-feature-desc">
                                Aligné avec les exigences françaises.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- ====== BÉNÉFICES MÉTIER End ====== -->

    <!-- ====== COMMENT ÇA MARCHE Start ====== -->
    <section id="how-it-works" class="ud-how-it-works" style="background: linear-gradient(180deg, #ffffff 0%, #f8fafc 50%); padding: 80px 0;">
        <div class="container">
            <div class="row">
                <div class="col-lg-12">
                    <div class="ud-section-title mx-auto text-center" style="margin-bottom: 3rem;">
                        <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: #1e293b;">Comment ça marche ?</h2>
                        <div style="max-width: 700px; margin: 0 auto; padding: 2rem; background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); border-radius: 16px; border-left: 4px solid var(--primary-color);">
                            <div style="display: flex; flex-direction: column; gap: 1.5rem; text-align: left;">
                                <div style="display: flex; align-items: start; gap: 1rem;">
                                    <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary-color); min-width: 40px;">1)</div>
                                    <p style="font-size: 1.1rem; color: #0c4a6e; margin: 0; line-height: 1.6;">
                                        Vous travaillez normalement
                                    </p>
                                </div>
                                <div style="display: flex; align-items: start; gap: 1rem;">
                                    <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary-color); min-width: 40px;">2)</div>
                                    <p style="font-size: 1.1rem; color: #0c4a6e; margin: 0; line-height: 1.6;">
                                        Nous sécurisons en arrière‑plan
                                    </p>
                                </div>
                                <div style="display: flex; align-items: start; gap: 1rem;">
                                    <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary-color); min-width: 40px;">3)</div>
                                    <p style="font-size: 1.1rem; color: #0c4a6e; margin: 0; line-height: 1.6;">
                                        Vous obtenez une preuve légale
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- ====== COMMENT ÇA MARCHE End ====== -->

    <!-- ====== CRÉDIBILITÉ Start ====== -->
    <section class="ud-who-we-are" style="padding: 80px 0; background: #ffffff;">
        <div class="container">
            <div class="row">
                <div class="col-lg-10 mx-auto">
                    <div class="ud-section-title mx-auto text-center">
                        <div style="max-width: 800px; margin: 0 auto;">
                            <p style="font-size: 1.5rem; line-height: 1.8; color: #1e293b; margin: 0;">
                                Basé à Nantes,<br>
                                ancré sur les réalités du terrain.
                            </p>
                            <p style="font-size: 1.25rem; line-height: 1.8; color: #64748b; margin: 1.5rem 0 0 0;">
                                Une approche simple,<br>
                                sans bullshit marketing,<br>
                                orientée métier.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- ====== CRÉDIBILITÉ End ====== -->

    <!-- ====== QUI SOMMES‑NOUS Start ====== -->
    <section class="ud-who-we-are" style="padding: 80px 0; background: #ffffff;">
        <div class="container">
            <div class="row">
                <div class="col-lg-10 mx-auto">
                    <div class="ud-section-title mx-auto text-center">
                        <div style="max-width: 800px; margin: 0 auto;">
                            <p style="font-size: 1.5rem; line-height: 1.8; color: #1e293b; margin: 0;">
                                Basé à Nantes,<br>
                                ancré sur les réalités du terrain.
                            </p>
                            <p style="font-size: 1.25rem; line-height: 1.8; color: #64748b; margin: 1.5rem 0 0 0;">
                                Une approche simple,<br>
                                sans bullshit marketing,<br>
                                orientée métier.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- ====== QUI SOMMES‑NOUS End ====== -->

    <!-- ====== CRÉDIBILITÉ Start ====== -->
    <section class="ud-credibility" style="padding: 80px 0; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);">
        <div class="container">
            <div class="row">
                <div class="col-lg-12">
                    <div class="ud-section-title mx-auto text-center" style="margin-bottom: 3rem;">
                        <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: #1e293b;">
                            Pourquoi nous faire confiance ?
                        </h2>
                    </div>
                </div>
            </div>
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="row">
                        <div class="col-lg-6 col-md-6 col-sm-12 mb-4">
                            <div style="display: flex; align-items: start; padding: 1.5rem; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <div style="font-size: 1.5rem; margin-right: 1rem;">🇫🇷</div>
                                <div>
                                    <h4 style="font-size: 1.1rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">
                                        Infrastructure souveraine
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6 col-md-6 col-sm-12 mb-4">
                            <div style="display: flex; align-items: start; padding: 1.5rem; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <div style="font-size: 1.5rem; margin-right: 1rem;">🔌</div>
                                <div>
                                    <h4 style="font-size: 1.1rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">
                                        ERP agnostique
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6 col-md-6 col-sm-12 mb-4">
                            <div style="display: flex; align-items: start; padding: 1.5rem; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <div style="font-size: 1.5rem; margin-right: 1rem;">✅</div>
                                <div>
                                    <h4 style="font-size: 1.1rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">
                                        Compatible Odoo & autres ERP
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6 col-md-6 col-sm-12 mb-4">
                            <div style="display: flex; align-items: start; padding: 1.5rem; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <div style="font-size: 1.5rem; margin-right: 1rem;">⚙️</div>
                                <div>
                                    <h4 style="font-size: 1.1rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">
                                        Automatisation complète
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-12 col-md-12 col-sm-12">
                            <div style="display: flex; align-items: start; padding: 1.5rem; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <div style="font-size: 1.5rem; margin-right: 1rem;">🇫🇷</div>
                                <div>
                                    <h4 style="font-size: 1.1rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">
                                        Hébergement en France
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- ====== Bloc Crédibilité End ====== -->

    <!-- ====== CTA Final Start ====== -->
    <section class="ud-cta-final" style="padding: 80px 0; background: linear-gradient(135deg, var(--primary-color) 0%, rgba(23, 158, 238, 0.9) 100%);">
        <div class="container">
            <div class="row">
                <div class="col-lg-12">
                    <div class="ud-section-title mx-auto text-center">
                        <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 2rem; color: white;">
                            Vous voulez voir comment<br>
                            ça fonctionne pour vous ?
                        </h2>
                        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                            <a href="{{ path('contact') }}" class="ud-main-btn ud-white-btn" onclick="if(typeof trackEvent === 'function') trackEvent('CTA', 'click', 'home_cta_final_demo', 1);">
                                👉 Demander une démo
                            </a>
                            <a href="{{ path('contact') }}" class="ud-main-btn ud-link-btn" style="color: white; border: 2px solid white;" onclick="if(typeof trackEvent === 'function') trackEvent('CTA', 'click', 'home_cta_final_contact', 1);">
                                👉 Me contacter
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- ====== CTA Final End ====== -->
    
    <script>
        // Ajuster la hauteur du hero pour que menu + hero = 100vh exactement
        (function() {
            function adjustHeroHeight() {
                const header = document.querySelector('.ud-header');
                const hero = document.querySelector('.ud-hero');
                
                if (header && hero) {
                    const headerHeight = header.offsetHeight;
                    const heroHeight = `calc(100vh - ${headerHeight}px)`;
                    // Utiliser height pour forcer exactement 100vh
                    hero.style.height = heroHeight;
                    hero.style.minHeight = heroHeight;
                    hero.style.maxHeight = heroHeight;
                }
            }
            
            // Ajuster immédiatement
            adjustHeroHeight();
            
            // Ajuster au chargement complet
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', adjustHeroHeight);
            }
            
            // Ajuster après chargement complet des images
            window.addEventListener('load', adjustHeroHeight);
            
            // Ajuster au redimensionnement (pour le menu mobile qui peut changer de hauteur)
            window.addEventListener('resize', adjustHeroHeight);
        })();
    </script>
{% endblock %}
```

---

## Notes techniques

### Structure

- **Template Twig** : Extends `layout.html.twig`
- **Blocks utilisés** : `title`, `meta_description`, `stylesheets`, `body`
- **Framework CSS** : Bootstrap (classes `container`, `row`, `col-lg-*`, etc.)

### Sections principales

1. **Hero** : Section principale avec layout 2 colonnes
2. **Contexte** : Section "Pourquoi maintenant"
3. **Problème** : Section "Problème réel"
4. **Solution** : Section "Solution"
5. **Bénéfices** : Section "Bénéfices métier"
6. **Comment ça marche** : Section avec numérotation
7. **Crédibilité** : Section "Qui sommes-nous" et "Pourquoi nous faire confiance"
8. **CTA Final** : Section d'appel à l'action finale

### JavaScript

- Script d'ajustement de hauteur pour que menu + hero = 100vh
- S'exécute au chargement, après chargement des images, et au redimensionnement

### Responsive

- Desktop : Layout 2 colonnes
- Mobile : Layout vertical avec CTA full width
- Breakpoints : 992px et 768px

---

**Fichier source** : `/opt/dorevia-plateform/units/sylius/templates/home/index.html.twig`
