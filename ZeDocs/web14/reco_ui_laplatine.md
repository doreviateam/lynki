# Recommandation complète — Migration de **sarl‑la‑platine** vers Dorevia Linky (HTTPS)

**Objectif** : Servir l’interface **Dorevia Linky** (Next.js / PWA) en HTTPS sur :

```
https://ui.lab.sarl-la-platine.doreviateam.com
```

(et optionnellement sur `stinger`), en remplacement d’Appsmith, conformément à la spec :

* `ZeDocs/web14/SPEC_DOREVIA_LINKY_UI_v2.0.md`

Ce document constitue **la recommandation opérable complète**, prête à être exécutée.

---

## 0. Contexte & principe

* **Un seul backend UI par hostname** `ui.<env>.<tenant>`.
* Le choix du backend UI est **piloté par le manifest** (`units.ui`).
* **Linky** est un produit *read‑only*, exposé en HTTPS derrière la gateway Caddy.
* **Rollback immédiat** possible vers Appsmith.

---

## 1. Builder l’image Linky (une fois)

Sur une machine disposant de Docker et du dépôt :

```bash
cd /opt/dorevia-plateform/units/dorevia-linky
docker build -t dorevia/linky:latest .
```

Optionnel (recommandé) : tag de version explicite

```bash
docker build -t dorevia/linky:v0.1.0 .
```

> L’image peut être poussée dans un registry si le serveur cible ne build pas localement.

---

## 2. Modifier le manifest du tenant

Fichier :

```
tenants/sarl-la-platine/state/manifest.json
```

### Patch exact à appliquer

### AVANT

```json
"units": {
  "odoo": ["odoo", "postgres"],
  "ui": ["appsmith"]
},
"images": {
  "odoo": "odoo:18.0-20250819",
  "postgres": "postgres:16"
}
```

### APRÈS (Linky activé)

```json
"units": {
  "odoo": ["odoo", "postgres"],
  "ui": ["linky"]
},
"images": {
  "odoo": "odoo:18.0-20250819",
  "postgres": "postgres:16",
  "linky": "dorevia/linky:latest"
}
```

> Aucun autre champ du manifest n’est modifié.

---

## 3. Régénérer le rendu (UI + Caddy)

Depuis la racine du dépôt :

```bash
cd /opt/dorevia-plateform
```

### Environnement **lab**

```bash
./bin/dorevia.sh render sarl-la-platine --env lab
```

> La commande `render` régénère Caddyfile, platform et **tous** les univers (dont ui) ; il n’y a pas d’option `--univers` — un seul appel suffit par env.

### (Optionnel) Environnement **stinger**

```bash
./bin/dorevia.sh render sarl-la-platine --env stinger
```

Résultat attendu :

* `tenants/sarl-la-platine/rendered/<env>/ui/docker-compose.yml`

  * service **linky**
  * `container_name: linky_<env>_sarl-la-platine`
  * port interne **3000**

* `tenants/sarl-la-platine/rendered/<env>/caddy/Caddyfile`

  * bloc `ui.<env>.sarl-la-platine.doreviateam.com`
  * `reverse_proxy linky_<env>_sarl-la-platine:3000`

---

## 4. Agréger et recharger la gateway

```bash
./bin/dorevia.sh gateway aggregate --reload
```

Vérification rapide :

```bash
grep -A2 "ui.lab.sarl-la-platine" units/gateway/Caddyfile
```

Attendu :

```
ui.lab.sarl-la-platine.doreviateam.com {
  reverse_proxy linky_lab_sarl-la-platine:3000
}
```

---

## 5. Démarrer Linky (lab)

Se placer dans le dossier rendu :

```bash
cd tenants/sarl-la-platine/rendered/lab/ui
```

Définir les variables d’environnement :

```bash
export VAULT_URL=http://vault-sarl-la-platine:8080
export TENANT_ID=sarl-la-platine
```

Puis lancer :

```bash
docker compose down
docker compose up -d
```

Vérification :

```bash
docker ps --filter name=linky_lab_sarl-la-platine
```

---

## 6. Vérifier l’accès HTTPS

1. Vérifier la résolution DNS de :

   ```
   ui.lab.sarl-la-platine.doreviateam.com
   ```

2. **(Facultatif)** Check backend Vault — distinguer problème Vault vs UI en quelques secondes. Depuis une machine qui atteint le conteneur Vault (ex. même hôte ou réseau Docker) :

   ```bash
   curl -s http://vault-sarl-la-platine:8080/ui/aggregations/sales \
     -G --data-urlencode "tenant=sarl-la-platine" \
     --data-urlencode "date_debut=2026-01-01" \
     --data-urlencode "date_fin=2026-02-01" \
     --data-urlencode "granularity=month"
   ```

   Réponse JSON (total, currency, verifiable, etc.) → Vault OK ; erreur ou vide → investiguer Vault avant l’UI.

3. Ouvrir dans un navigateur :

   ```
   https://ui.lab.sarl-la-platine.doreviateam.com
   ```
4. Résultat attendu :

   * page d’accueil **Dorevia Linky**
   * carte **« Ventes certifiées »** visible si le Vault répond

### Diagnostic rapide

| Symptom         | Cause probable                                                 |
| --------------- | -------------------------------------------------------------- |
| 502 Bad Gateway | conteneur Linky non joignable (nom / réseau / port 3000)       |
| Page blanche    | erreur runtime Linky → `docker logs linky_lab_sarl-la-platine` |
| SSL KO          | relancer `gateway aggregate --reload` et vérifier Caddy        |

---

## 7. Rollback vers Appsmith (si nécessaire)

1. Dans le manifest :

   ```json
   "ui": ["appsmith"]
   ```
2. Refaire :

   ```bash
   ./bin/dorevia.sh render sarl-la-platine --env lab
   ./bin/dorevia.sh gateway aggregate --reload
   ```
3. Relancer Appsmith à la place de Linky dans le compose UI.

Rollback **immédiat et sans impact**.

---

## 8. Prochaines étapes recommandées

1. Valider Linky sur **lab** avec données réelles.
2. Taguer l’image : `dorevia/linky:v0.1.0`.
3. Geler la spec `SPEC_DOREVIA_LINKY_UI_v2.0.md`.
4. Ajouter la 2ᵉ carte (Encaissements certifiés).

---

## Conclusion

Cette migration :

* transforme `ui.*` en **surface produit**,
* respecte l’architecture Dorevia existante,
* reste **réversible**,
* prépare Linky comme **UI officielle** à moyen terme.

**Recommandation** : procéder sans attendre sur l’environnement `lab`.
