# Guide opérationnel quotidien — Plateforme Dorevia

**Public** : tout opérateur (pas seulement l’administrateur initial).  
**Objectif** : exécuter les actions courantes sans retenir les chemins ni les noms de projet Docker.

---

## 1. Démarrer la stack DVIG + Vault (core-stinger)

**Quand** : après un redémarrage du serveur, ou si les factures Odoo restent en « Échec temporaire » (502 sur DVIG).

**Une commande** (depuis la racine du projet) :

```bash
./scripts/start_core_stinger_stack.sh
```

**Équivalent manuel** (si le script n’est pas exécutable) :

```bash
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker compose -p dorevia_core-stinger_platform up -d
```

**Vérification** : `./scripts/check_core_stinger_health.sh` (voir ci‑dessous).

---

## 2. Vérifier que DVIG et Vault répondent (santé)

**Quand** : après un démarrage, ou en cas de doute sur un 502.

```bash
./scripts/check_core_stinger_health.sh
```

Le script affiche l’état des conteneurs (dvig, vault, vault-db) et un test de connectivité Caddy → DVIG.

---

## 3. Erreur 502 sur l’ingest des factures (DVIG)

**Symptôme** : dans Odoo, section « SÉCURITÉ DE LA FACTURE », message du type :  
`502 Server Error: Bad Gateway for url: https://dvig.core-stinger.doreviateam.com/ingest`

**Cause fréquente** : le conteneur DVIG n’est pas démarré.

**À faire** :

1. Démarrer toute la stack (voir §1) :  
   `./scripts/start_core_stinger_stack.sh`
2. Vérifier la santé :  
   `./scripts/check_core_stinger_health.sh`
3. Dans Odoo, sur la facture concernée : cliquer sur **« Refresh Proof Now »** (ou attendre la prochaine tentative CRON).

**Détails** : voir `ZeDocs/web12/RAPPORT_502_DVIG_INGEST_20260205.md`.

---

## 4. Vider le cache et redémarrer le site Sylius (landing)

**Quand** : après une modification des templates Twig ou du CSS, si la page ne se met pas à jour.

```bash
./scripts/restart_sylius_cache.sh
```

**Équivalent manuel** :

```bash
docker exec sylius_lab_core_php-fpm sh -c "rm -rf /var/www/html/var/cache/prod/*"
cd /opt/dorevia-plateform/units/sylius && docker compose restart php-fpm-core nginx-core
```

Ensuite : recharger la page en **Ctrl+Shift+R** (ou navigation privée) pour éviter le cache navigateur.

---

## 5. Récapitulatif des scripts utiles

| Script | Rôle |
|--------|------|
| `scripts/start_core_stinger_stack.sh` | Démarrer DVIG + Vault + BDD (tenant core-stinger) |
| `scripts/check_core_stinger_health.sh` | Vérifier que DVIG et Vault répondent |
| `scripts/restart_sylius_cache.sh` | Vider le cache Symfony Sylius et redémarrer PHP-FPM + Nginx |

Tous les scripts sont à lancer **depuis la racine du projet** (`/opt/dorevia-plateform` ou équivalent).

---

## 6. En cas de problème

- **502 sur DVIG** : rapport détaillé et résolution dans `ZeDocs/web12/RAPPORT_502_DVIG_INGEST_20260205.md`.
- **Tenant / déploiement avancé** : voir `COMMANDES_PIEREZ.md` (guide complet projet pierez et chemins avancés).
