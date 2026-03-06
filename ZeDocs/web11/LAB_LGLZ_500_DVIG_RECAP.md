# Lab LGLZ — Erreur 500 sur DVIG /ingest : récap

**Constat** : Sur le lab LGLZ (odoo.lab.lglz.doreviateam.com), les factures restent en « Échec temporaire » avec une erreur **HTTP 500** sur `https://dvig.core-stinger.doreviateam.com/ingest`. La Platine (stinger) fonctionne sans souci avec le même DVIG.

---

## Cause du problème

- **DVIG exige** : le **tenant du token** doit être égal au **tenant de la source**.
- **La Platine** : source = `odoo.stinger.sarl-la-platine` → tenant = `sarl-la-platine`. Le token DVIG est enregistré avec ce tenant → OK.
- **Lab LGLZ** : source = `odoo.lab.lglz` → tenant = `lglz`. Sur le lab LGLZ vous avez mis le **même token que La Platine** (tenant `sarl-la-platine`). Donc **tenant source (`lglz`) ≠ tenant token (`sarl-la-platine`)** → DVIG renvoie **403 TENANT_MISMATCH**.

En plus, dans le code DVIG, cette 403 était capturée par un `except Exception` et renvoyée en **500** au lieu de 403. Donc l’écran Odoo affichait « 500 » au lieu de « 403 TENANT_MISMATCH ». (Correctif appliqué : les HTTPException sont maintenant relancées.)

---

## Solution (à faire quand vous serez dispo)

**Objectif** : avoir un **token dédié** pour le tenant `lglz` sur DVIG core-stinger, et l’utiliser uniquement sur le lab LGLZ. La Platine et le stinger ne sont pas modifiés.

1. **Sur le serveur DVIG core-stinger** (ou là où se trouve le dépôt `sources/dvig`) :
   - Générer un token pour le tenant `lglz` :
     ```bash
     cd /opt/dorevia-plateform/sources/dvig
     python -m dvig.cli.token_gen --tenant lglz --univers odoo --output token
     ```
     Noter la ligne **TOKEN=...**
   - Ajouter l’entrée au fichier de tokens DVIG (ex. `/etc/dvig/tokens.yml` ou `conf/tokens.yml`) :
     ```bash
     python -m dvig.cli.token_gen --tenant lglz --univers odoo --output yaml
     ```
     Copier le bloc YAML affiché et l’ajouter dans la section `tokens:` du fichier. Recharger DVIG (redémarrage du service ou rechargement des tokens selon la config).

2. **Sur Odoo lab LGLZ** : Paramètres → Technique → Paramètres système → modifier **`dorevia.dvig.token`** et mettre la valeur **TOKEN** générée à l’étape 1 (remplacer l’ancien token copié de La Platine).

3. Tester : sur une facture, cliquer sur « Trigger DVIG Worker Now » (ou laisser le CRON faire). Le statut devrait passer à « Protégée » (ou afficher une autre erreur explicite si un souci reste).

---

## Références

- Détail complet (paramètres, CRONs, autres erreurs) : **VAULT_LAB_LGLZ_DIAGNOSTIC.md**
- Correctif code DVIG (ne plus avaler la 403) : **sources/dvig/dvig/api_fastapi/routes/ingest.py** (re-raise HTTPException)
