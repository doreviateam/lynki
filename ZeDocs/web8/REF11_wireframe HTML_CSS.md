<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dorevia-Vault — Des chiffres vrais. Enfin.</title>
  <meta name="description" content="Dorevia-Vault automatise la capture et le scellage de vos événements financiers pour produire des preuves opposables. Dispositif conçu pour la conformité LNE 2026 / NF525." />
  <meta name="theme-color" content="#0b1220" />

  <style>
    :root{
      --bg:#0b1220;
      --panel:#0f1a2e;
      --card:#111f38;
      --text:#e9eefc;
      --muted:#b7c2df;
      --muted2:#91a0c8;
      --line:rgba(255,255,255,.10);
      --shadow: 0 12px 34px rgba(0,0,0,.35);
      --radius: 18px;

      --max: 1120px;
      --pad: 20px;

      --btn:#10b981;
      --btnText:#071a14;
      --btn2:rgba(255,255,255,.10);
      --btn2Text: var(--text);

      --h1: clamp(34px, 6vw, 56px);
      --h2: clamp(24px, 3.6vw, 36px);
      --h3: 18px;
      --p: 16px;
      --lh: 1.55;
    }

    *{ box-sizing:border-box; }
    html,body{ height:100%; }
    body{
      margin:0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji","Segoe UI Emoji";
      background: radial-gradient(1200px 600px at 10% 0%, rgba(16,185,129,.10), transparent 55%),
                  radial-gradient(900px 500px at 90% 10%, rgba(233,238,252,.08), transparent 55%),
                  var(--bg);
      color:var(--text);
    }
    a{ color: inherit; text-decoration: none; }
    .container{ width: min(var(--max), calc(100% - (var(--pad) * 2))); margin: 0 auto; }
    .section{ padding: 100px 0; } /* Augmenté pour respiration (Benchmark Pennylane) */
    .grid{ display:grid; gap: 18px; }
    .card{
      background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
      border:1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .card-inner{ padding: 18px; }

    /* Header */
    header{
      position: sticky;
      top: 0;
      backdrop-filter: blur(10px);
      background: rgba(11,18,32,.66);
      border-bottom: 1px solid var(--line);
      z-index: 20;
    }
    .nav{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 14px 0;
      gap: 12px;
    }
    .brand{
      display:flex;
      align-items:center;
      gap: 10px;
      min-width: 180px;
    }
    .logo{
      width: 34px;
      height: 34px;
      border-radius: 10px;
      border:1px solid var(--line);
      background: rgba(255,255,255,.06);
      display:grid;
      place-items:center;
      font-weight: 800;
      letter-spacing: .5px;
    }
    .brand-title{ font-weight: 700; font-size: 14px; line-height: 1.1; }
    .brand-sub{ font-size: 12px; color: var(--muted2); margin-top: 2px; }

    .navlinks{
      display:none;
      gap: 16px;
      align-items:center;
      color: var(--muted);
      font-size: 14px;
    }
    .navlinks a:hover{ color: var(--text); }

    .navcta{ display:flex; gap:10px; align-items:center; }

    /* Buttons */
    .btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:10px;
      border-radius: 999px;
      padding: 14px 24px; /* Augmenté pour plus de confort */
      border: 1px solid transparent;
      font-weight: 700;
      font-size: 15px; /* Augmenté */
      cursor: pointer;
      user-select:none;
      white-space: nowrap;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-primary:hover{
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(16,185,129,.25);
      background: #14d393;
    }
    .btn-secondary:hover{
      background: rgba(255,255,255,.15);
      border-color: rgba(255,255,255,.3);
    }
    .btn-primary{
      background: var(--btn);
      color: var(--btnText);
      box-shadow: 0 10px 22px rgba(16,185,129,.18);
    }
    .btn-secondary{
      background: var(--btn2);
      border-color: var(--line);
      color: var(--btn2Text);
    }
    .btn:active{ transform: translateY(1px); }

    /* Hero */
    .hero{ padding: 56px 0 24px; }
    .hero-wrap{
      display:grid;
      gap: 18px;
      align-items:center;
    }
    .kicker{
      display:inline-flex;
      align-items:center;
      gap:10px;
      font-size: 13px;
      color: var(--muted);
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(255,255,255,.04);
      width: fit-content;
    }
    h1{ font-size: var(--h1); line-height: 1.05; margin: 10px 0 10px; letter-spacing: -.02em; }
    .subhead{
      font-size: 18px;
      color: var(--muted);
      line-height: var(--lh);
      margin: 0 0 14px;
      max-width: 58ch;
    }
    .audience{
      font-size: 14px;
      color: var(--muted2);
      margin: 0 0 18px;
      max-width: 70ch;
    }

    .proofpoints{
      display:grid;
      gap: 10px;
      margin: 14px 0 18px;
    }
    .pp{
      display:flex;
      gap: 10px;
      align-items:flex-start;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(255,255,255,.04);
    }
    .dot{
      width: 10px; height: 10px; border-radius: 999px;
      background: rgba(16,185,129,.9);
      margin-top: 5px;
      flex: 0 0 auto;
    }
    .pp b{ color: var(--text); }
    .pp span{ color: var(--muted); font-size: 14px; line-height: 1.4; }

    .hero-cta{ display:flex; flex-wrap: wrap; gap: 10px; align-items:center; margin-top: 6px; }

    .hero-visual{
      min-height: 280px;
      display:grid;
      place-items:center;
      border-radius: var(--radius);
      border:1px dashed rgba(255,255,255,.22);
      background: rgba(255,255,255,.03);
      overflow: hidden;
      position: relative;
    }
    .placeholder-label{
      color: var(--muted2);
      font-size: 13px;
      text-align:center;
      padding: 0 14px;
    }
    .asset-note{
      margin-top: 10px;
      font-size: 12px;
      color: var(--muted2);
    }

    /* Section titles */
    .section-title{
      font-size: var(--h2);
      line-height: 1.15;
      margin: 0 0 10px;
      letter-spacing: -.015em;
    }
    .section-lead{
      color: var(--muted);
      font-size: var(--p);
      line-height: var(--lh);
      margin: 0 0 22px;
      max-width: 72ch;
    }

    /* Section layout */
    .two-col{ display:grid; gap: 16px; }
    .bullets{ display:grid; gap: 12px; }

    .block-title{
      font-size: 16px;
      margin: 0 0 6px;
      font-weight: 800;
      letter-spacing: -.01em;
    }
    p{ margin: 0; font-size: var(--p); line-height: var(--lh); color: var(--muted); }

    .asset{
      border-radius: var(--radius);
      border:1px dashed rgba(255,255,255,.22);
      background: rgba(255,255,255,.03);
      min-height: 220px;
      display:grid;
      place-items:center;
      padding: 14px;
    }

    .inline-cta{ display:flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }

    /* Footer */
    footer{
      border-top: 1px solid var(--line);
      padding: 34px 0 46px;
      background: rgba(0,0,0,.08);
    }
    .footer-grid{
      display:grid;
      gap: 18px;
    }
    .signature{
      font-weight: 900;
      font-size: 18px;
      letter-spacing: -.01em;
      margin: 0 0 8px;
    }
    .legal{
      font-size: 13px;
      color: var(--muted2);
      line-height: 1.55;
      margin-top: 10px;
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(255,255,255,.03);
    }
    .footer-links{
      display:grid;
      gap: 10px;
      font-size: 14px;
      color: var(--muted);
    }
    .footer-links a:hover{ color: var(--text); }
    .sovereignty{
      color: var(--muted);
      font-size: 13px;
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(255,255,255,.03);
    }

    /* Responsive */
    @media (min-width: 920px){
      .navlinks{ display:flex; }
      .hero-wrap{ grid-template-columns: 1.15fr .85fr; gap: 24px; }
      .two-col{ grid-template-columns: 1fr 1fr; align-items:start; gap: 18px; }
      .asset{ min-height: 300px; }
      .footer-grid{ grid-template-columns: 1.2fr .8fr; align-items:start; }
    }

    /* Anchor offset for sticky header */
    .anchor{ scroll-margin-top: 84px; }
  </style>
</head>

<body>
  <!-- HEADER -->
  <header>
    <div class="container">
      <div class="nav">
        <a class="brand" href="#top">
          <div class="logo">DV</div>
          <div>
            <div class="brand-title">Dorevia-Vault</div>
            <div class="brand-sub">Infrastructure de vérité financière</div>
          </div>
        </a>

        <nav class="navlinks" aria-label="Navigation">
          <a href="#positionnement">Positionnement</a>
          <a href="#fonctionnement">Fonctionnement</a>
          <a href="#conformite">Conformité</a>
          <a href="#manifeste">Manifeste</a>
          <a href="#contact">Contact</a>
        </nav>

        <div class="navcta">
          <a class="btn btn-secondary" href="#contact">Parler à un humain</a>
          <a class="btn btn-primary" href="#fonctionnement">Voir une preuve</a>
        </div>
      </div>
    </div>
  </header>

  <!-- HERO -->
  <main id="top" class="hero">
    <div class="container">
      <div class="hero-wrap">
        <div>
          <div class="kicker">🇫🇷 Souverain • Lecture seule • Preuve opposable</div>

          <h1>Des chiffres vrais. Enfin.</h1>

          <p class="subhead">
            Automatisez la capture et le scellage de vos événements financiers pour les rendre opposables.
          </p>

          <p class="audience">
            Pour dirigeants, CFO et équipes financières qui doivent pouvoir prouver leurs chiffres à tout moment.
          </p>

          <div class="proofpoints" role="list">
            <div class="pp" role="listitem">
              <div class="dot" aria-hidden="true"></div>
              <div><b>Automatique.</b> <span>Zéro ressaisie, zéro manipulation humaine.</span></div>
            </div>
            <div class="pp" role="listitem">
              <div class="dot" aria-hidden="true"></div>
              <div><b>Immuable.</b> <span>Horodatage et scellage cryptographique.</span></div>
            </div>
            <div class="pp" role="listitem">
              <div class="dot" aria-hidden="true"></div>
              <div><b>Opposable.</b> <span>Preuves vérifiables, prêtes pour contrôle.</span></div>
            </div>
          </div>

          <div class="hero-cta">
            <a class="btn btn-primary" href="#fonctionnement">Voir comment une facture devient une preuve</a>
            <a class="btn btn-secondary" href="#contact">Parler à un humain</a>
          </div>

          <div class="asset-note">
            Visuel Hero attendu : <b>metaphore-compteur-vault.svg</b>
          </div>
        </div>

        <div class="hero-visual card">
          <div class="card-inner">
            <div class="placeholder-label">
              <b>Placeholder visuel</b><br/>
              Déposer ici <code>metaphore-compteur-vault.svg</code>
              <div class="asset-note">Format SVG • mobile-first • lisible en petit</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- SECTION 1 -->
  <section id="fonctionnement" class="section anchor">
    <div class="container">
      <h2 class="section-title">Chaque événement devient une preuve. Automatiquement.</h2>
      <p class="section-lead">
        Dorevia-Vault transforme vos événements financiers quotidiens en preuves fiables, sans changer vos outils ni vos processus.
      </p>

      <div class="two-col">
        <div class="asset card" aria-label="Visuel flux valeur probante">
          <div class="placeholder-label">
            <b>Placeholder schéma</b><br/>
            Déposer ici <code>flux-valeur-probante.svg</code>
          </div>
        </div>

        <div class="card">
          <div class="card-inner bullets">
            <div>
              <div class="block-title">Capture automatique des événements financiers.</div>
              <p>Dorevia-Vault se connecte à votre ERP ou système de facturation et capture chaque événement dès qu’il se produit, sans ressaisie et sans intervention humaine.</p>
            </div>
            <div>
              <div class="block-title">Scellage probant et immuable.</div>
              <p>Chaque événement est horodaté, signé et scellé cryptographiquement. Une fois capturé, il ne peut plus être modifié.</p>
            </div>
            <div>
              <div class="block-title">Production immédiate d’une preuve opposable.</div>
              <p>Vous disposez d’une preuve vérifiable et traçable, prête à être présentée en cas de contrôle, d’audit ou de litige.</p>
            </div>

            <div class="inline-cta">
              <a class="btn btn-primary" href="#preuve">Voir un exemple de preuve réelle</a>
              <a class="btn btn-secondary" href="#conformite">Comprendre l’architecture</a>
            </div>
          </div>
        </div>
      </div>

      <div id="preuve" class="grid" style="margin-top:18px;">
        <div class="card">
          <div class="card-inner two-col">
            <div>
              <div class="block-title">Objet de preuve (tangible).</div>
              <p>Micro-visuel attendu pour rendre la preuve concrète et rassurante.</p>
              <div class="asset-note">Déposer : <b>objet-preuve-scellee.svg</b></div>
            </div>
            <div class="asset" aria-label="Objet preuve scellée">
              <div class="placeholder-label">
                Placeholder <code>objet-preuve-scellee.svg</code>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- SECTION 2 -->
  <section id="conformite" class="section anchor">
    <div class="container">
      <h2 class="section-title">Une preuve n’a de valeur que si l’infrastructure est irréprochable.</h2>
      <p class="section-lead">
        Souveraineté, sécurité, traçabilité et séparation des rôles : le dispositif est conçu pour une démarche de certification by design.
      </p>

      <div class="two-col">
        <div class="card">
          <div class="card-inner bullets">
            <div>
              <div class="block-title">Infrastructure souveraine, sous juridiction française.</div>
              <p>Dorevia-Vault est opéré sur une infrastructure hébergée en France, sans dépendance à des clouds extra-européens.</p>
            </div>
            <div>
              <div class="block-title">Intégrité garantie dans le temps.</div>
              <p>Empreintes cryptographiques, horodatage précis et chaîne de traçabilité assurent l’immutabilité des données.</p>
            </div>
            <div>
              <div class="block-title">Architecture conçue pour la conformité LNE 2026 / NF525.</div>
              <p>Dorevia-Vault met en œuvre les exigences réglementaires NF525 et anticipe les obligations de facturation électronique, dans une démarche de certification by design.</p>
              <div class="asset-note">Badge attendu : <b>badge-conformite-lne.svg</b></div>
            </div>
            <div>
              <div class="block-title">IA souveraine, en lecture seule.</div>
              <p>DIVA explique et audite vos données, sans jamais pouvoir les modifier.</p>
            </div>
            <div>
              <div class="block-title">Agnostique ERP, sans verrou technologique.</div>
              <p>Dorevia-Vault sécurise vos outils existants, il ne les remplace pas.</p>
            </div>

            <div class="inline-cta">
              <a class="btn btn-primary" href="#manifeste">Explorer l’architecture en détail</a>
              <a class="btn btn-secondary" href="#moment">Voir un contrôle avec Dorevia-Vault</a>
            </div>
          </div>
        </div>

        <div class="grid">
          <div class="asset card" aria-label="Visuel souveraineté France">
            <div class="card-inner placeholder-label">
              <b>Placeholder visuel</b><br/>
              Déposer <code>ecosysteme-souverain.svg</code>
            </div>
          </div>
          <div class="asset card" aria-label="Badge conformité">
            <div class="card-inner placeholder-label">
              <b>Placeholder badge</b><br/>
              Déposer <code>badge-conformite-lne.svg</code>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- SECTION 3 -->
  <section id="moment" class="section anchor">
    <div class="container">
      <h2 class="section-title">Le jour où l’on vous demande des preuves, vous êtes prêt.</h2>
      <p class="section-lead">
        Le bénéfice final : répondre immédiatement, sans recherche ni reconstruction. Et piloter avec des faits scellés.
      </p>

      <div class="two-col">
        <div class="grid">
          <div class="asset card" aria-label="Scène CFO rassuré">
            <div class="card-inner placeholder-label">
              <b>Placeholder scène</b><br/>
              Déposer <code>scene-cfo-rassure.svg</code>
            </div>
          </div>
          <div class="asset card" aria-label="Scène contrôle fiscal">
            <div class="card-inner placeholder-label">
              <b>Placeholder scène</b><br/>
              Déposer <code>scene-controle-fiscal.svg</code>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-inner bullets">
            <div>
              <div class="block-title">Contrôle / audit</div>
              <p>Lors d’un contrôle, vos preuves sont déjà disponibles. Vous répondez immédiatement, sans recherche ni reconstruction.</p>
            </div>
            <div>
              <div class="block-title">Litige</div>
              <p>En cas de contestation, vous ne défendez pas une version : vous présentez une preuve scellée et vérifiable.</p>
            </div>
            <div>
              <div class="block-title">Pilotage</div>
              <p><b>Passez du doute à la certitude :</b> vos décisions reposent sur des faits scellés, pas sur des fichiers modifiables.</p>
            </div>

            <div class="inline-cta" id="contact">
              <a class="btn btn-primary" href="#integration">Voir comment Dorevia-Vault s’intègre chez vous</a>
              <a class="btn btn-secondary" href="#contact-form">Échanger avec un humain</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact / Diagnostic (wireframe) -->
      <div id="integration" class="grid" style="margin-top:18px;">
        <div class="card">
          <div class="card-inner two-col">
            <div>
              <div class="block-title">Contact & Diagnostic (wireframe)</div>
              <p>Bloc simple pour capter une conversation qualifiée, sans friction.</p>
              <p class="asset-note">À relier ensuite à ton outil (Sylius / Odoo CRM / email).</p>
            </div>
            <form id="contact-form" class="grid" style="gap:10px;">
              <label style="display:grid; gap:6px;">
                <span style="font-size:13px; color:var(--muted2);">Nom</span>
                <input type="text" name="name" placeholder="Votre nom" required
                  style="padding:12px 14px; border-radius:14px; border:1px solid var(--line); background: rgba(255,255,255,.04); color: var(--text);" />
              </label>
              <label style="display:grid; gap:6px;">
                <span style="font-size:13px; color:var(--muted2);">Email</span>
                <input type="email" name="email" placeholder="vous@entreprise.fr" required
                  style="padding:12px 14px; border-radius:14px; border:1px solid var(--line); background: rgba(255,255,255,.04); color: var(--text);" />
              </label>
              <label style="display:grid; gap:6px;">
                <span style="font-size:13px; color:var(--muted2);">Message</span>
                <textarea name="message" rows="4" placeholder="Votre contexte : ERP, volume, besoin (audit, conformité, pilotage)…"
                  style="padding:12px 14px; border-radius:14px; border:1px solid var(--line); background: rgba(255,255,255,.04); color: var(--text); resize: vertical;"></textarea>
              </label>
              <button class="btn btn-primary" type="submit">Demander un diagnostic</button>
              <div style="font-size:12px; color:var(--muted2);">
                En envoyant, vous acceptez d’être recontacté. (RGPD : données utilisées uniquement pour répondre.)
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- FOOTER -->
  <footer id="manifeste" class="anchor">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="signature">Dorevia-Vault : La vérité financière, certifiée à la source.</div>
          <div class="legal">
            <b>Disclaimer de certification (légal)</b><br/>
            Dorevia-Vault est un dispositif conçu pour l'obtention des certifications LNE 2026 et NF525.
            Les dossiers techniques de preuve sont tenus à disposition dans le cadre de nos audits.
            Les démarches de certification sont menées conformément au cadre réglementaire en vigueur.
          </div>
          <div class="sovereignty" style="margin-top:12px;">
            <b>Hébergé en France.</b> Sous juridiction française. IA souveraine DIVA.
          </div>
        </div>

        <div class="footer-links">
          <a href="#top">Positionnement (Hero)</a>
          <a href="#fonctionnement">Fonctionnement (Section 1)</a>
          <a href="#conformite">Conformité (Section 2)</a>
          <a href="#moment">Moment de vérité (Section 3)</a>
          <a href="#contact">Contact & Diagnostic</a>
        </div>
      </div>
    </div>
  </footer>

  <script>
    // Wireframe: prevent form submission (replace later by real integration)
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      alert("Wireframe : formulaire non connecté. À brancher sur ton backend / Sylius / Odoo CRM.");
    });
  </script>
</body>
</html>
