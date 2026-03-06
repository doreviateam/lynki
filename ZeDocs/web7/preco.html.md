# 📘 Préconisation HTML --- Landing Page Dorevia-Vault

## Objectif

Implémenter la nouvelle structure de landing page alignée sur le funnel
: Curiosité → Compréhension → Preuve → Conversation → Conversion

------------------------------------------------------------------------

## SECTION 1 --- HERO (inchangé)

``` html
<section id="home" class="ud-hero">
  <!-- Hero actuel (figé) -->
</section>
```

------------------------------------------------------------------------

## SECTION 2 --- POSITIONNEMENT

``` html
<section id="positionnement" class="dv-section dv-position">
  <div class="container">
    <header>
      <h2>
        L’ERP est votre matière première.<br>
        Nous la transformons en vérité.
      </h2>
    </header>

    <p>
      Vous avez déjà un ERP (Odoo, etc.).<br>
      Il génère des événements en continu :
      factures, paiements, écritures.
    </p>

    <p>
      Mais rien ne garantit leur
      <strong>valeur probante</strong>.
    </p>

    <p>
      Dorevia-Vault transforme vos événements ERP
      en <strong>preuves financières exploitables</strong>,
      conformes <strong>LNE 2026 / NF525</strong>.
    </p>

    <a href="#demo">Voir la démo</a>
  </div>
</section>
```

------------------------------------------------------------------------

## SECTION 3 --- PREUVE

``` html
<section id="demo" class="dv-section dv-proof">
  <div class="container">
    <h2>Voir plutôt que croire</h2>

    <ul>
      <li>Instance Odoo réelle</li>
      <li>Vrais flux</li>
      <li>Collecte automatique</li>
      <li>Preuves générées</li>
    </ul>

    <p>
      L’interface Dorevia-Vault arrive ensuite
      pour exploiter ces preuves :
      tableaux de bord, pilotage, vérification.
    </p>

    <a href="/demo">Voir la démo</a>
    <small>Instance réelle • Pas un fake • 30 minutes</small>
  </div>
</section>
```

------------------------------------------------------------------------

## SECTION 4 --- CONVERSATION

``` html
<section id="conversation" class="dv-section dv-conversation">
  <div class="container">
    <h2>Parlez-nous de votre projet</h2>

    <p>
      Vous avez une douleur métier ?<br>
      Un contexte particulier ?<br>
      Un ERP spécifique ?
    </p>

    <a href="/contact">Parlez-nous de votre projet</a>

    <small>
      Je lis tous les messages.<br>
      Je m’en sers pour affiner le produit.
    </small>
  </div>
</section>
```

------------------------------------------------------------------------

## SECTION 5 --- MANIFESTE (condensé)

``` html
<section id="manifeste" class="dv-section dv-manifest">
  <div class="container">
    <h2>Pourquoi Dorevia-Vault existe</h2>

    <p>
      Nous pensons que la donnée financière
      doit être fiable, traçable et prouvable
      dès sa création.
    </p>

    <p>
      Nous construisons une infrastructure
      de vérité financière pour les 10 prochaines années.
    </p>
  </div>
</section>
```

------------------------------------------------------------------------

## SECTION 6 --- CTA FINAL

``` html
<section id="cta-final" class="dv-section dv-cta">
  <div class="container text-center">
    <h2>Prêt à passer aux chiffres prouvés ?</h2>

    <a href="/demo">Demander une démo</a>
    <a href="/contact">Parler de votre projet</a>

    <small>30 minutes • sans engagement</small>
  </div>
</section>
```

------------------------------------------------------------------------

## Notes d'implémentation

-   Supprimer de la home :
    -   Pour qui
    -   Cas d'usage
    -   Conformité
-   Chaque section = 1 message
-   Toujours 1 CTA max par section

------------------------------------------------------------------------

**Fin du document**
