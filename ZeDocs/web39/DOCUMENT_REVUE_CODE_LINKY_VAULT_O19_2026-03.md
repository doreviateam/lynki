# Document pour revue de code — Linky / Vault / Odoo o19 (mars 2026)

**Objectif** : permettre une revue de code complète des changements réalisés pour le tenant o19 (carte Business, vérité totale, stabilisation des données, alignement header/footer preuves scellées).

**Périmètre** : modifications sur la branche courante (ex. `feature/landing-v2-refonte` ou équivalent) depuis les correctifs o19 / Linky décrits dans le rapport MOA et les runbooks.

---

## 1. Contexte fonctionnel

| Besoin | Réponse apportée |
|--------|------------------|
| Carte Business « fausse » (400 € au lieu de 4 387 €) | Agrégats ventes/achats depuis Odoo (ERP) pour o19 via nouvel endpoint + fallback Linky. |
| Affichage différent à chaque mise à jour Linky | Une seule source pour la grille et la carte (Odoo pour o19) ; dashboard-metrics aligné. |
| « Vérité totale » pour l’utilisateur | Source de vérité affichée (footer + cartes) ; API tenant expose `primary_source` (erp/vault). |
| Header « 6 preuves » / footer « 7 preuves » | Une seule source pour le nombre : `dashboardMetrics.sealed_count` passé au badge et au footer. |

**Références** : `RUNBOOK_STABILISATION_DONNEES_LINKY_O19.md`, `RUNBOOK_VAULT_RECONCIL_O19.md`, `RAPPORT_MOA_PORT_ACCOUNT_RECONCILE_OCA_O19_2026-03-07.md`.

**Principe** : **Linky ne dépend ni de DVIG ni d’Odoo ; il ne voit que le Vault.** Linky récupère toutes ses données dans le Vault : les API Linky (dashboard-metrics, treasury, payments-in/out, sales, purchases, completeness-snapshot, etc.) appellent uniquement le Vault (`VAULT_URL`). DVIG et Odoo sont en amont (Odoo → DVIG → Vault) pour alimenter le Vault ; Linky n’a pas de dépendance directe à leur égard.

### 1.1 Règle : Linky = données probantes Vault reflétant Odoo

**Ce que nous avons toujours dit :** Linky travaille avec des **données probantes** fournies par le Vault. Il n’y a pas d’appel direct Linky → Odoo pour les encaissements/décaissements (carte Cash) : la source est le Vault uniquement.

**Objectif :** que Linky affiche la **vérité des données vaultées** reflétant ce qui est dans Odoo. Donc le Vault doit contenir (ingéré et scellé) ce qui existe dans Odoo. Tant que la synchro Odoo → Vault n’est pas complète ou pas en temps réel, Linky aura une vision partielle — **par conception** (données probantes), pas par bug d’affichage.

**Chaîne technique (pour que le Vault reflète Odoo) :**
- **Odoo** : à chaque paiement `posted`, le connecteur `dorevia_vault_connector` (modèle `account.payment`) envoie l’événement à **DVIG** (`POST .../ingest`, `event_type: payment.posted`). Un **cron** `cron_vault_send_payments` reprend les paiements en `todo` non envoyés. Un **backfill** `backfill_vault_todo()` permet d’initialiser en `todo` les paiements déjà postés (pour rattrapage).
- **DVIG** : le worker outbox envoie `payment.posted` au **Vault** (`POST /api/v1/payments`).
- **Vault** : agrège les paiements reçus ; Linky lit `GET /ui/aggregations/payments-in` (et `payments-out`).

Si les montants Linky (Cash) sont inférieurs à Odoo : vérifier dans Odoo l’état **`dorevia_vault_status`** des paiements (`todo` → envoi en attente, `pending_proof` → envoyé, preuve en attente), la bonne exécution du cron, la connectivité DVIG → Vault, et éventuellement lancer un backfill pour les paiements existants.

### 1.2 Diagnostic : pourquoi les données vaultées ne reflètent pas Odoo ?

| Cause probable | Où vérifier | Action |
|----------------|-------------|--------|
| **Tenant différent** | Le token DVIG utilisé par Odoo est lié à un **tenant** (ex. `core`, `default`). Linky appelle le Vault avec `TENANT_ID` (ex. `o19`). Si les deux ne correspondent pas, le Vault a les paiements sous un tenant et Linky interroge un autre → encaissements vides ou partiels. | Générer un token DVIG pour le tenant **o19** (ou celui de `TENANT_ID` Linky) et configurer Odoo avec ce token. Vérifier `dorevia.vault.tenant` / token dans Odoo = `TENANT_ID` dans Linky. |
| **DVIG non configuré dans Odoo** | Si `dorevia.dvig.url` ou `dorevia.dvig.token` est vide, `_should_vault()` renvoie False → aucun envoi. | Paramètres système Odoo : renseigner `dorevia.dvig.url`, `dorevia.dvig.token`, et `dorevia.dvig.source` (ex. `odoo.lab.o19` pour que source ↔ tenant cohérent). |
| **Paiements antérieurs au connecteur** | Paiements déjà validés avant activation du connecteur n’ont pas `dorevia_vault_status` / idempotency_key → le cron les prend en théorie, mais le backfill initialise proprement tout le lot. | En Odoo (shell ou action planifiée) : `env['account.payment'].backfill_vault_todo()` pour marquer en `todo` les paiements éligibles non encore traités. |
| **Cron paiements inactif** | Nous nous passons de queue_job ; seuls les crons envoient (Vault Send Payments toutes les 2 min, Vault Fetch Proof Payments toutes les 1 min). | Vérifier que les crons « Vault Send Payments » et « Vault Fetch Proof Payments » sont actifs et s’exécutent. |
| **Worker DVIG outbox non démarré** | Les événements restent en outbox dans DVIG et ne partent jamais vers le Vault. | S’assurer que le worker outbox DVIG tourne (process/container dédié) et qu’il peut joindre l’URL du Vault. Consulter les logs DVIG (forward_success / forward_failed). |
| **Réseau ou erreur Vault** | DVIG envoie bien mais le Vault renvoie 4xx/5xx ou timeout. | Logs DVIG (erreurs de forwarding), logs Vault. Vérifier l’URL du Vault et le header `X-Tenant` envoyé par DVIG (doit correspondre au tenant attendu par le Vault). |

En résumé : **pour que Linky affiche la vérité des données vaultées reflétant Odoo**, il faut que la chaîne Odoo (connecteur + cron/backfill) → DVIG (ingest + worker outbox) → Vault soit complète et que le **tenant** soit le même partout (Odoo/DVIG token, Vault agrégations, Linky `TENANT_ID`).

**Constat (vérification mars 2026) :** le **processus Odoo → DVIG → Vault ne fonctionne pas** pour le tenant o19. L’appel `GET /ui/aggregations/payments-completeness` a montré : Odoo 4 paiements / 4 387 €, Vault 4 documents / 1 297 €, et `missing_odoo_ids: [1,2,3,4]`. Les paiements Odoo ne sont donc pas correctement ingérés dans le Vault sous le tenant o19. **Plan de correction détaillé** : voir `PLAN_CORRECTION_ODOO_DVIG_VAULT_O19.md` (diagnostic par maillon, corrections ordonnées, validation).

---

## 2. Fichiers modifiés ou créés — inventaire

### 2.1 Odoo (dorevia_vault_connector)

| Fichier | Type | Rôle |
|---------|------|------|
| `units/odoo/custom-addons/dorevia_vault_connector/controllers/linky_business_aggregation.py` | **Création** | Endpoint GET `/dorevia/vault/linky_business_aggregation` : agrégats ventes/achats depuis `account.move` (postés, par période, option `company_id`). Format compatible réponses Vault. |
| `units/odoo/custom-addons/dorevia_vault_connector/controllers/__init__.py` | Modification | Import et chargement de `linky_business_aggregation`. |

**Points de revue Odoo** :
- [x] Sécurité : token API interne optionnel (`dorevia.linky.internal.token` ou `ODOO_LINKY_INTERNAL_TOKEN`) ; si configuré, header `Authorization: Bearer` ou `X-Internal-Token` requis, sinon 403. Voir `PRECONISATIONS_TECHNIQUES_STABILISATION_LINKY_VAULT_O19_2026-03.md`.
- [ ] Domaine des mouvements : `state='posted'`, `move_type` in (`out_invoice`,`out_refund`) / (`in_invoice`,`in_refund`), `invoice_date` entre `date_from` et `date_to`.
- [ ] Gestion `company_id` : extraction `odoo:N` → N, existence de la société.
- [ ] Séries : regroupement par mois (`YYYY-MM`), montants TTC ; avoirs (refund) en négatif.
- [ ] Gestion d’erreurs : log + réponse 500 avec message.

---

### 2.2 Linky — API (Next.js)

| Fichier | Rôle |
|---------|------|
| `units/dorevia-linky/app/api/tenant/route.ts` | Retourne `tenant_id` et **`primary_source`** : `"erp"` si `TENANT_ID === "o19"` et `ODOO_O19_URL` défini, sinon `"vault"`. |
| `units/dorevia-linky/app/api/sales/route.ts` | Si `tenant === "o19"` et `ODOO_O19_URL` : appel à Odoo `linky_business_aggregation`, retourne `body.sales` ; sinon proxy Vault ; fallback Vault en cas d’erreur Odoo. |
| `units/dorevia-linky/app/api/purchases/route.ts` | Même logique que sales pour `body.purchases`. |
| `units/dorevia-linky/app/api/dashboard-metrics/route.ts` | Constante `ODOO_O19_URL` ; pour `tenant === "o19"` et URL définie : `fetchSealedSourcesO19()` (Odoo business aggregation + Vault payments-in/out/pos) ; fallback Vault pour sales/purchases si Odoo échoue ; sinon `fetchSealedSourcesWithRetry()` inchangé. |

**Points de revue API** :
- [x] Tenant imposé côté serveur (`process.env.TENANT_ID`) pour sales, purchases, dashboard-metrics (préconisation sécurité).
- [x] Timeout Odoo configurable : `ODOO_TIMEOUT_MS` (défaut 5000) ; token interne `ODOO_O19_INTERNAL_TOKEN` / `LINKY_ODOO_INTERNAL_TOKEN` envoyé en `Authorization: Bearer` si défini.
- [x] Fallback Vault : header de réponse `X-Data-Source: vault-fallback` et log structuré lorsque les données business viennent du Vault après échec Odoo.
- [ ] Pas de fuite d’informations sensibles (URL Odoo, tokens) dans les réponses.
- [ ] Paramètres transmis à Odoo : `date_from`, `date_to`, `granularity`, `tenant`, `company_id` (optionnel).

---

### 2.3 Linky — Composants et layout

| Fichier | Rôle |
|---------|------|
| `units/dorevia-linky/components/DashboardWithFilters.tsx` | État `primarySource` et `sealedCount` issus de `/api/tenant` et `dashboardMetrics` ; passage de `primarySource` à Trésorerie, Business, LinkyFooter ; passage de `sealedCountTotal={dashboardMetrics?.sealed_count}` au footer. |
| `units/dorevia-linky/components/LinkyFooter.tsx` | Prop **`sealedCountTotal`** : si fourni, utilisé pour « Preuves scellées » (alignement header/footer) ; sinon `status?.sealed_count_total` (fetch platform/status). Affichage « Source : ERP (Odoo) » / « Source : Vault » selon `primarySource` (préconisations UX mars 2026). |
| `units/dorevia-linky/components/IntegrityBadge.tsx` | Affichage du nombre : priorité à la prop **`sealedCount`** (depuis dashboard-metrics) si c’est un nombre ; sinon `status.sealed_count_total` (fetch platform/status). Aligne le badge header sur la même source que le footer. |
| `units/dorevia-linky/components/BusinessCardWithPolling.tsx` | Prop **`primarySource`** ; détection header `X-Data-Source: vault-fallback` pour afficher « Source temporaire : Vault (ERP indisponible) » ; `whyContent.dataSource` : « Source : ERP (Odoo) » / « Source : Vault ». |
| `units/dorevia-linky/components/TreasuryCardWithPolling.tsx` | Prop **`primarySource`** ; même principe pour `whyContent` (source et règle selon erp/vault). |

**Points de revue UI** :
- [ ] Pas de régression sur les tenants autres que o19 (comportement par défaut « vault »).
- [x] Libellés : « Source : ERP (Odoo) » / « Source : Vault » (remplacement « Vérité : indicateurs ERP » — préconisations UX). Indicateur fallback : « Source temporaire : Vault (ERP indisponible) » lorsque header `X-Data-Source: vault-fallback`.
- [ ] Accessibilité : tooltips, aria-labels. Cohérence des libellés (fr).

---

### 2.4 Configuration et documentation

| Fichier | Rôle |
|---------|------|
| `tenants/o19/apps/ui/lab/docker-compose.yml` | Variable **`ODOO_O19_URL`** (défaut `http://odoo_lab_o19:8069`) pour données Business et grille depuis Odoo. |
| `ZeDocs/web39/PRECONISATIONS_TECHNIQUES_STABILISATION_LINKY_VAULT_O19_2026-03.md` | Préconisations techniques (sécurité, perf, tenant, timeouts, observabilité, UX) et plan d’action implémenté. |
| `ZeDocs/web39/RUNBOOK_STABILISATION_DONNEES_LINKY_O19.md` | Runbook : vérité totale, source unique, config Linky/Vault/Odoo, vérifications. |
| `ZeDocs/web39/RUNBOOK_VAULT_RECONCIL_O19.md` | Ajout section « Stabilisation données Linky o19 » avec lien vers le runbook stabilisation. |
| `ZeDocs/web39/RAPPORT_MOA_PORT_ACCOUNT_RECONCILE_OCA_O19_2026-03-07.md` | Référence ajoutée vers `RUNBOOK_STABILISATION_DONNEES_LINKY_O19.md`. |

---

## 3. Checklist revue de code

### 3.1 Sécurité
- [ ] Aucun secret (token, mot de passe) en clair dans le code ou les réponses API.
- [ ] Endpoint Odoo `linky_business_aggregation` : exposition acceptable (réseau interne / reverse proxy).
- [ ] Pas de paramètre utilisateur non validé envoyé à Odoo ou au Vault (dates, tenant, company_id).

### 3.2 Cohérence des données
- [ ] Tenant o19 + `ODOO_O19_URL` : même source pour Trésorerie (Vault proxy Odoo), Business (Linky → Odoo), grille (dashboard-metrics → Odoo).
- [ ] Nombre de preuves : une seule source (dashboard-metrics `sealed_count`) pour badge header et footer.
- [ ] Fallback : si Odoo indisponible, utilisation du Vault pour sales/purchases sans casser l’UI.

### 3.3 Régression
- [ ] Tenant autre que o19 : pas d’appel à `ODOO_O19_URL` ; comportement inchangé (Vault seul).
- [ ] Absence de `ODOO_O19_URL` : `primary_source === "vault"`, footer et cartes affichent « Vault ».
- [ ] Dashboard-metrics : cas minimal (sans company_id, période large) et cas o19 avec Odoo.

### 3.4 Performance et robustesse
- [ ] Timeouts cohérents (API sales/purchases, dashboard-metrics, platform/status).
- [ ] Pas de boucle de requêtes (pas d’appel récursif Linky → Linky).
- [ ] Gestion des annulations (AbortController, cleanup useEffect).

### 3.5 Maintenabilité
- [ ] Commentaires et noms de variables clairs (primary_source, sealedCountTotal, fetchSealedSourcesO19).
- [ ] Documentation runbooks à jour et référencées.

---

## 4. Commandes utiles pour la revue

```bash
# Fichiers modifiés (à adapter selon la branche)
git diff main --name-only -- units/odoo/custom-addons/dorevia_vault_connector/
git diff main --name-only -- units/dorevia-linky/
git diff main --name-only -- tenants/o19/

# Lancer les tests (si présents)
cd units/dorevia-linky && npm run build
cd units/odoo/custom-addons/dorevia_vault_connector && python -m pytest  # si configuré
```

---

## 5. Code implémenté par module

### 5.1 Odoo 19 (dorevia_vault_connector)

**Fichier créé** : `units/odoo/custom-addons/dorevia_vault_connector/controllers/linky_business_aggregation.py`

- Route GET `/dorevia/vault/linky_business_aggregation` (auth=public).
- Helper `_aggregate_moves(env, company, date_from, date_to, move_types)` : domaine `state='posted'`, `move_type` in move_types, `invoice_date` entre date_from/date_to ; optionnel `company_id` ; totaux TTC/HT, séries par mois ; avoirs (out_refund/in_refund) en négatif.
- Contrôleur : récupération company (optionnel company_id), appel `_aggregate_moves` pour ventes `(out_invoice, out_refund)` et achats `(in_invoice, in_refund)` ; formatage `sales_resp` / `purchases_resp` au format Vault ; retour JSON `{ sales, purchases }` ; en cas d’exception, log + 500.

**Fichier modifié** : `controllers/__init__.py` — ajout `from . import linky_business_aggregation`.

---

### 5.2 Linky (Next.js)

**API tenant** (`app/api/tenant/route.ts`) : `ODOO_O19_URL` ; retourne `tenant_id` et `primary_source` = `"erp"` si tenant o19 et URL définie, sinon `"vault"`.

**API sales** (`app/api/sales/route.ts`) : si `tenant === "o19"` et `ODOO_O19_URL`, fetch `ODOO_O19_URL/dorevia/vault/linky_business_aggregation?date_from=&date_to=&...`, retourne `body.sales` ; sinon et en fallback, proxy Vault `/ui/aggregations/sales`.

**API purchases** (`app/api/purchases/route.ts`) : même logique, retourne `body.purchases`.

**API dashboard-metrics** (`app/api/dashboard-metrics/route.ts`) : constante `ODOO_O19_URL` ; fonction `fetchSealedSourcesO19()` — fetch Odoo `linky_business_aggregation`, récupère sales/purchases ; fallback Vault pour sales/purchases si null ; fetch Vault pour payments-in, payments-out, pos-sessions ; retourne `{ sales, purchases, paymentsIn, paymentsOut, pos }`. `sealedResultsPromise = tenant === "o19" && ODOO_O19_URL ? fetchSealedSourcesO19() : fetchSealedSourcesWithRetry()`.

**DashboardWithFilters** : état `primarySource` ; dans useEffect `/api/tenant`, `setPrimarySource(d?.primary_source === "erp" ? "erp" : "vault")` ; passage `primarySource` à TreasuryCardWithPolling, BusinessCardWithPolling, LinkyFooter ; passage `sealedCountTotal={dashboardMetrics?.sealed_count}` à LinkyFooter.

**LinkyFooter** : props `primarySource`, `sealedCountTotal` ; `sealedCount = sealedCountTotalProp != null ? sealedCountTotalProp : status?.sealed_count_total` ; bloc « Vérité : indicateurs ERP (Odoo) » si erp, sinon « Vérité : documents scellés (Vault) ».

**IntegrityBadge** : `displayCount = typeof sealedCount === "number" && sealedCount >= 0 ? sealedCount : countFromStatus` (priorité au prop pour aligner header/footer).

**BusinessCardWithPolling** : prop `primarySource` ; `whyContent.dataSource` = `primarySource === "erp" ? "ERP (Odoo) — vérité unique" : "Vault (agrégations)"` ; idem `calculationRule`.

**TreasuryCardWithPolling** : prop `primarySource` ; même `whyContent.dataSource` / `calculationRule` selon erp/vault.

**Compose o19** (`tenants/o19/apps/ui/lab/docker-compose.yml`) : variable `ODOO_O19_URL: ${ODOO_O19_URL:-http://odoo_lab_o19:8069}`.

---

### 5.3 Vault

Aucune modification du code Vault dans ce lot. Utilisation de la config existante (ex. `ODOO_BANK_RECONCILIATION_URL_O19`).

---

### 5.4 Extraits de code complets (copier-coller)

#### Odoo — `linky_business_aggregation.py` (intégral)

```python
# -*- coding: utf-8 -*-
"""Endpoint Linky — Agrégation ventes / achats (carte Business). GET /dorevia/vault/linky_business_aggregation"""
import logging
from collections import defaultdict
from odoo import http, SUPERUSER_ID
from odoo.http import request, Response

_logger = logging.getLogger(__name__)

def _json_response(data, status=200):
    return Response(__import__("json").dumps(data, default=str), status=status, mimetype="application/json")

def _aggregate_moves(env, company, date_from, date_to, move_types, currency_field="currency_id"):
    Move = env["account.move"].sudo()
    domain = [
        ("state", "=", "posted"), ("move_type", "in", list(move_types)),
        ("invoice_date", ">=", date_from), ("invoice_date", "<=", date_to),
    ]
    if company:
        domain.append(("company_id", "=", company.id))
    moves = Move.search(domain)
    total, total_ht = 0.0, 0.0
    by_period = defaultdict(float)
    for m in moves:
        ttc, ht = float(m.amount_total), float(m.amount_untaxed)
        if m.move_type in ("out_refund", "in_refund"):
            ttc, ht = -ttc, -ht
        total += ttc
        total_ht += ht
        if m.invoice_date:
            by_period[m.invoice_date.strftime("%Y-%m")] += ttc
    total_tax = max(0, total - total_ht)
    series = [{"period": p, "amount": round(amt, 2)} for p, amt in sorted(by_period.items())]
    currency = "EUR"
    if moves and getattr(moves[0], currency_field, None) and moves[0].currency_id:
        currency = moves[0].currency_id.name or "EUR"
    return {"total": round(total, 2), "total_ht": round(total_ht, 2), "total_tax": round(total_tax, 2),
            "invoices_count": len(moves), "series": series, "currency": currency}

class LinkyBusinessAggregationController(http.Controller):
    @http.route("/dorevia/vault/linky_business_aggregation", type="http", methods=["GET"], auth="public", csrf=False)
    def linky_business_aggregation(self, company_id=None, date_from=None, date_to=None, **kwargs):
        try:
            env = request.env(user=SUPERUSER_ID)
            company = env.company
            if company_id:
                try:
                    cid = int(str(company_id).split(":")[-1])
                    company = env["res.company"].sudo().browse(cid)
                    if not company.exists():
                        company = env.company
                except (ValueError, TypeError):
                    pass
            date_from = date_from or "2000-01-01"
            date_to = date_to or "2030-12-31"
            tenant = kwargs.get("tenant") or "o19"
            granularity = kwargs.get("granularity") or "month"
            sales = _aggregate_moves(env, company, date_from, date_to, ("out_invoice", "out_refund"))
            purchases = _aggregate_moves(env, company, date_from, date_to, ("in_invoice", "in_refund"))
            sales_resp = {"tenant": tenant, "scope": "invoice.posted", "currency": sales["currency"],
                "total": sales["total"], "total_ht": sales["total_ht"], "total_tax": sales["total_tax"],
                "invoices_count": sales["invoices_count"], "posted_sales_count": sales["invoices_count"],
                "from": date_from, "to": date_to, "effective_from": date_from, "effective_to": date_to,
                "granularity": granularity, "series": sales["series"], "last_seal_at": None, "verifiable": True}
            purchases_resp = {"tenant": tenant, "scope": "invoice.posted", "currency": purchases["currency"],
                "total": purchases["total"], "total_ht": purchases["total_ht"], "total_tax": purchases["total_tax"],
                "invoices_count": purchases["invoices_count"], "posted_purchases_count": purchases["invoices_count"],
                "from": date_from, "to": date_to, "effective_from": date_from, "effective_to": date_to,
                "granularity": granularity, "series": purchases["series"], "last_seal_at": None, "verifiable": True}
            return _json_response({"sales": sales_resp, "purchases": purchases_resp})
        except Exception as e:
            _logger.exception("linky_business_aggregation failed: %s", e)
            return _json_response({"error": str(e)}, status=500)
```

#### Linky — `app/api/tenant/route.ts` (intégral)

```typescript
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const ODOO_O19_URL = process.env.ODOO_O19_URL || "";

export async function GET() {
  const tenantId = process.env.TENANT_ID || "core";
  const primarySource = tenantId === "o19" && ODOO_O19_URL ? ("erp" as const) : ("vault" as const);
  return NextResponse.json({ tenant_id: tenantId, primary_source: primarySource });
}
```

#### Linky — `app/api/sales/route.ts` (bloc o19 uniquement)

```typescript
if (tenant === "o19" && ODOO_O19_URL) {
  const odooParams = new URLSearchParams({
    date_from: date_debut, date_to: date_fin, granularity, tenant: "o19",
    ...(company_id && { company_id }),
  });
  const odooUrl = `${ODOO_O19_URL.replace(/\/$/, "")}/dorevia/vault/linky_business_aggregation?${odooParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AGG_TIMEOUT_MS);
  try {
    const res = await fetch(odooUrl, { headers: { Accept: "application/json" }, cache: "no-store", signal: controller.signal });
    clearTimeout(timeoutId);
    const body = await res.json();
    if (!res.ok) return NextResponse.json({ error: body?.error ?? "Erreur Odoo o19" }, { status: res.status });
    const sales = (body as { sales?: unknown }).sales;
    if (sales != null) return NextResponse.json(sales);
  } catch { clearTimeout(timeoutId); }
}
// suite : proxy Vault (params, fetch, return data)
```

#### Linky — `IntegrityBadge.tsx` (extrait affichage count)

```typescript
const countFromStatus = status.sealed_count_total != null && status.sealed_count_total >= 0 ? status.sealed_count_total : null;
const displayCount = typeof sealedCount === "number" && sealedCount >= 0 ? sealedCount : countFromStatus;
const hasCount = displayCount != null;
```

#### Linky — `LinkyFooter.tsx` (props + sealedCount + truthBlock)

```typescript
export function LinkyFooter({ tenantId, primarySource = "vault", sealedCountTotal: sealedCountTotalProp }: {
  tenantId: string; primarySource?: "erp" | "vault"; sealedCountTotal?: number | null;
}) {
  // ...
  const sealedCount = sealedCountTotalProp != null ? sealedCountTotalProp : status?.sealed_count_total;
  const truthBlock = primarySource === "erp" ? (
    <span className="font-medium text-[var(--positive)]">Vérité : indicateurs ERP (Odoo)</span>
  ) : (
    <span className="text-[var(--text-secondary)]">Vérité : documents scellés (Vault)</span>
  );
```

---

## 6. Résumé pour le relecteur

- **Odoo** : un nouveau contrôleur expose les agrégats ventes/achats (format Vault) pour que Linky affiche les chiffres ERP pour o19.
- **Linky** : pour o19 avec `ODOO_O19_URL`, les API sales/purchases et dashboard-metrics utilisent Odoo pour Business ; le tenant expose `primary_source` ; le footer et les cartes indiquent la source de vérité ; le nombre de preuves scellées provient d’une seule source (dashboard-metrics) pour éviter l’écart header/footer.
- **Config** : compose ui o19 définit `ODOO_O19_URL` ; les runbooks décrivent la stabilisation et la « vérité totale ».

Ce document peut servir de base à une revue de code formelle (checklist, assignation, suivi des remarques).
