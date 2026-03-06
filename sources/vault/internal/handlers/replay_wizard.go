package handlers

import (
	"net/url"

	"github.com/gofiber/fiber/v2"
)

// ReplayWizardHandler sert la page HTML du wizard « Rebrancher un ERP » (E7-US1)
func ReplayWizardHandler(c *fiber.Ctx) error {
	tenant := c.Query("tenant", "core")
	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.SendString(replayWizardHTML(tenant))
}

// ReplayJobDetailHandler sert la page HTML de suivi d'un job (E7-US1)
func ReplayJobDetailHandler(c *fiber.Ctx) error {
	jobID := c.Params("id")
	if jobID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Missing job id"})
	}
	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.SendString(replayJobDetailHTML(jobID))
}

func replayWizardHTML(tenant string) string {
	// Base URL pour les API (même origine en prod)
	apiBase := "/api/v1/replay"
	return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Rebrancher un ERP — Dorevia Vault</title>
  <style>
    :root { color-scheme: light dark; --bg:#fafafa; --fg:#1a1a1a; --accent:#007aff; --muted:#666; --border:#ddd; }
    @media (prefers-color-scheme: dark){ :root{ --bg:#0f1116; --fg:#eaeaea; --accent:#4ea1ff; --muted:#999; --border:#333; } }
    body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--fg);margin:0;padding:2rem;max-width:520px;margin:0 auto}
    h1{font-size:1.5rem;margin-bottom:1.5rem}
    .form-group{margin-bottom:1rem}
    label{display:block;font-weight:500;margin-bottom:.3rem;font-size:.9rem}
    input,select{width:100%;padding:.5rem .75rem;border:1px solid var(--border);border-radius:6px;font-size:1rem;background:var(--bg);color:var(--fg)}
    button{background:var(--accent);color:#fff;border:none;padding:.6rem 1.2rem;border-radius:6px;font-size:1rem;cursor:pointer}
    button:hover{opacity:.9}
    button:disabled{opacity:.5;cursor:not-allowed}
    .back{margin-bottom:1rem}
    .back a{color:var(--accent);text-decoration:none}
    .error{color:#c00;font-size:.9rem;margin-top:.5rem}
    .muted{color:var(--muted);font-size:.85rem}
  </style>
</head>
<body>
  <div class="back"><a href="/">← Retour</a></div>
  <h1>🔌 Rebrancher un ERP</h1>
  <p class="muted">Replay des événements Vault vers Odoo. Choisir la période et le mode.</p>

  <form id="wizard-form">
    <div class="form-group">
      <label for="tenant">Tenant</label>
      <input type="text" id="tenant" name="tenant" value="` + tenant + `" required />
    </div>
    <div class="form-group">
      <label for="range_from">Période — De</label>
      <input type="date" id="range_from" name="range_from" required />
    </div>
    <div class="form-group">
      <label for="range_to">Période — À</label>
      <input type="date" id="range_to" name="range_to" required />
    </div>
    <div class="form-group">
      <label for="mode">Mode</label>
      <select id="mode" name="mode">
        <option value="dry_run">Simulation (dry-run)</option>
        <option value="apply">Application réelle (apply)</option>
      </select>
    </div>
    <div class="form-group" id="odoo-options" style="display:none">
      <label>Options Odoo (apply)</label>
      <input type="url" id="odoo_url" placeholder="https://odoo.example.com" />
      <input type="text" id="odoo_database" placeholder="base (optionnel)" style="margin-top:.3rem" />
      <input type="text" id="odoo_user" placeholder="admin" style="margin-top:.3rem" />
      <input type="password" id="odoo_password" placeholder="password" style="margin-top:.3rem" />
    </div>
    <div class="form-group">
      <button type="submit" id="submit-btn">Lancer le replay</button>
    </div>
    <div id="error" class="error"></div>
  </form>

  <script>
    document.getElementById('mode').addEventListener('change', function(){
      document.getElementById('odoo-options').style.display = this.value === 'apply' ? 'block' : 'none';
    });
    document.getElementById('wizard-form').addEventListener('submit', async function(e){
      e.preventDefault();
      var btn = document.getElementById('submit-btn');
      var err = document.getElementById('error');
      btn.disabled = true;
      err.textContent = '';
      var payload = {
        tenant: document.getElementById('tenant').value,
        mode: document.getElementById('mode').value,
        range: {
          from: document.getElementById('range_from').value,
          to: document.getElementById('range_to').value
        }
      };
      if (payload.mode === 'apply') {
        var url = document.getElementById('odoo_url').value;
        if (!url) { err.textContent = 'URL Odoo requise en mode apply'; btn.disabled = false; return; }
        payload.options = { odoo_url: url };
        var db = document.getElementById('odoo_database').value;
        if (db) payload.options.odoo_database = db;
        payload.options.odoo_user = document.getElementById('odoo_user').value || 'admin';
        payload.options.odoo_password = document.getElementById('odoo_password').value || 'admin';
      }
      try {
        var r = await fetch('` + apiBase + `/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        var data = await r.json();
        if (r.ok && data.job_id) {
          window.location.href = '/replay/jobs/' + data.job_id;
        } else {
          err.textContent = data.error || data.details || 'Erreur ' + r.status;
        }
      } catch (x) {
        err.textContent = 'Erreur réseau: ' + x.message;
      }
      btn.disabled = false;
    });
    var d = new Date();
    document.getElementById('range_from').value = d.getFullYear() + '-01-01';
    document.getElementById('range_to').value = d.toISOString().slice(0,10);
  </script>
</body>
</html>`
}

func replayJobDetailHTML(jobID string) string {
	apiBase := "/api/v1/replay"
	jobIDEsc := url.PathEscape(jobID)
	return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Job Replay — Dorevia Vault</title>
  <style>
    :root { color-scheme: light dark; --bg:#fafafa; --fg:#1a1a1a; --accent:#007aff; --muted:#666; --border:#ddd; }
    @media (prefers-color-scheme: dark){ :root{ --bg:#0f1116; --fg:#eaeaea; --accent:#4ea1ff; --muted:#999; --border:#333; } }
    body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--fg);margin:0;padding:2rem;max-width:640px;margin:0 auto}
    h1{font-size:1.3rem}
    .back{margin-bottom:1rem}
    .back a{color:var(--accent);text-decoration:none}
    .card{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:1rem;margin:1rem 0}
    .stat{display:inline-block;margin-right:1.5rem;margin-bottom:.5rem}
    .links{margin-top:1rem}
    .links a{color:var(--accent);margin-right:1rem}
  </style>
</head>
<body>
  <div class="back"><a href="/replay/wizard">← Nouveau replay</a></div>
  <h1>Job Replay <code id="job-id">` + jobID + `</code></h1>
  <div class="card">
    <div id="status">Chargement…</div>
    <div id="stats" class="stat"></div>
    <div class="links">
      <a href="` + apiBase + `/jobs/` + jobIDEsc + `/logs" target="_blank">📋 Logs</a>
      <a href="` + apiBase + `/jobs/` + jobIDEsc + `/report" target="_blank">📄 Rapport</a>
    </div>
  </div>
  <script>
    (async function(){
      var r = await fetch('` + apiBase + `/jobs/` + jobIDEsc + `');
      var job = await r.json();
      document.getElementById('status').innerHTML = '<strong>Statut:</strong> ' + (job.status || 'inconnu');
      var s = job.stats_json || job.stats;
      if (s) {
        var html = '';
        if (s.events_total != null) html += '<span class="stat">Événements: ' + s.events_total + '</span>';
        if (s.applied != null) html += '<span class="stat">Appliqués: ' + s.applied + '</span>';
        if (s.skipped != null) html += '<span class="stat">Ignorés: ' + s.skipped + '</span>';
        if (s.failed != null) html += '<span class="stat">Échecs: ' + s.failed + '</span>';
        document.getElementById('stats').innerHTML = html;
      }
    })();
  </script>
</body>
</html>`
}
