# 🔧 Dépannage — `external_layout` non appliqué sur les PDF (Devis/Commandes Odoo 18)

## Symptôme

Les PDF générés pour **devis/commandes** sortent en rendu "brut" :

- pas d'en-tête (logo/adresse),
- pas de pied de page,
- mise en page minimale.

> ✅ **Note** : si `wkhtmltopdf` est présent (ex. `0.12.6.1 (with patched qt)`), ce n'est **pas** un problème Docker/convertisseur PDF ; on est presque toujours sur un **rapport QWeb** qui **n'appelle pas** `web.external_layout`.

---

## Cause la plus fréquente

Le PDF que tu génères utilise un rapport/templating qui **bypasse** le layout externe.

Dans ton instance, tu as typiquement **deux rapports** côté Sales :

- **Devis/Commande (standard)** : `sale.report_saleorder`
- **Devis/Commande (raw/minimal)** : `sale.report_saleorder_raw`

Si tu imprimes le rapport **raw**, le rendu peut être minimal (selon surcharges/modules).

---

## Étape 0 — Vérification express `wkhtmltopdf` (déjà validé chez toi)

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose exec -T odoo sh -lc 'which wkhtmltopdf && wkhtmltopdf -V || echo "wkhtmltopdf absent"'
```

Attendu : une version `0.12.x` "patched qt".

---

## Étape 1 — Identifier **quel rapport** est réellement utilisé

### Depuis l'interface Odoo (recommandé)

1. Ouvre un **devis** (ou une **commande**)
2. Clique **Imprimer**
3. Note précisément l'entrée sélectionnée :
   - **Devis en PDF** / **Devis / Commande** (standard)
   - ou une entrée alternative (raw/minimal/custom)

### Vérifier dans *Paramètres → Technique → Rapports*

- Cherche **Devis / Commande** et **Devis en PDF**
- Note le **Nom technique** (`sale.report_saleorder`, `sale.report_saleorder_raw`, etc.)

> 🎯 Objectif : confirmer si ton bouton pointe vers `sale.report_saleorder` (attendu) ou `sale.report_saleorder_raw` (suspect).

---

## Étape 2 — Vérifier que le template QWeb appelle `external_layout`

### Méthode UI (la plus fiable)

1. Active le **mode développeur**
2. Va dans : **Paramètres → Technique → Rapports**
3. Ouvre le rapport concerné (ex. `sale.report_saleorder`)
4. Clique sur **Vue QWeb** (ou "Template" selon écran)
5. Dans le code de la vue : `Ctrl+F` → cherche **`external_layout`**

✅ Cas normal (layout appliqué) :
```xml
<t t-call="web.external_layout">
```

❌ Cas problématique (layout ignoré) :
- pas de `external_layout`,
- ou wrapper différent du layout.

---

## Étape 3 — Solution durable : corriger via un mini-module (recommandé)

### Pourquoi un module ?

- reproductible (Lab/Stinger/Prod),
- versionnable,
- évite les modifications "à la main" en base.

### Ce que fait le module

- Il **hérite** la vue QWeb du devis,
- Il enveloppe le contenu dans :
  ```xml
  <t t-call="web.external_layout">
  ```

> ✅ C'est exactement ce qui "force" l'application du layout (Light/Boxed + logo + footer).

---

## Étape 4 — Contrôles secondaires (à faire si le layout est bien appelé mais rendu encore incomplet)

### 4.1 Logo / société

- Paramètres → Sociétés → ta société → **Logo**
- Vérifier qu'un logo est bien défini (et pas vide)

### 4.2 Paramètres système utiles

- `web.base.url` : doit pointer vers l'URL publique de ton instance (utile pour liens/ressources).

> ⚠️ `report.url` n'est pas toujours pertinent selon versions/config ; n'y touche que si tu sais exactement pourquoi.

### 4.3 Cache / redémarrage

Après modifications (module / vues QWeb) :

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose restart odoo
```

Puis rafraîchissement navigateur : `Ctrl+Shift+R` / `Cmd+Shift+R`.

---

## Étape 5 — Logs utiles (optionnel)

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose logs odoo | grep -iE "report|qweb|template|external_layout|wkhtml"
```

---

## Checklist finale (ce qui doit être vrai)

- [ ] Tu imprimes bien le **rapport standard** (`sale.report_saleorder`) et non le `*_raw`
- [ ] La vue QWeb appelée contient **`<t t-call="web.external_layout">`**
- [ ] Le logo société est défini
- [ ] `wkhtmltopdf` est présent et fonctionnel
- [ ] Odoo a été redémarré après patch/module

---

## Si ça persiste

Dans ce cas, il reste généralement :

1. **Une surcharge** par un autre module (héritage QWeb) qui remplace le wrapper.
2. Un bouton "Imprimer" qui pointe vers un **rapport alternatif**.

👉 Pour trancher, note :
- le **Nom technique du rapport** (exact),
- le **nom technique de la vue QWeb** utilisée,
- et si `external_layout` apparaît (oui/non).

Avec ces 3 infos, on corrige au millimètre.
