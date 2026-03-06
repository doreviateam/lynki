# Checklist — Démo multi-tenant laplatine2026

**Date :** 2026-02-28  
**Objectif :** Vérifier les éléments disponibles avant exécution

---

## Éléments disponibles

| Élément | Statut |
|---------|--------|
| Dump `/tmp/laplatine_20260228.dump` | ✅ |
| DNS (ui.lab.laplatine2026, odoo.lab.laplatine2026) | ✅ |
| Vault partagé (core-stinger) | ✅ |
| DVIG partagé (core-stinger) | ✅ |
| Structure de référence (sarl-la-platine, core) | ✅ |
| Commande `dorevia.sh token issue` | ✅ |

---

## Éléments à préciser

| Élément | Question |
|---------|----------|
| **Nom exact du dump** | ✅ `laplatine_20260228.dump` |
| **Format du dump** | `.dump` (custom pg_dump) → `pg_restore` ; `.sql` (plain) → `psql` |
| **Nom de la base source** | Quel `dbname` dans le dump ? (influence la création cible) |
| **Filestore** | ✅ Pas de filestore (dump DB uniquement) — pièces jointes absentes dans le clone |
| **Chemin plateforme sur serveur** | `/opt/dorevia-plateform` ? |
| **Réseau Docker** | `dorevia-network` existant sur le serveur ? |

---

## Procédure si tout est OK

1. Créer le tenant `laplatine2026` (manifest, apps/odoo/lab, apps/ui/lab)
2. Générer token DVIG : `dorevia.sh token issue odoo lab laplatine2026`
3. Mettre à jour `dvig.tokens.yml` (core-stinger)
4. Rendre Caddyfile + relancer gateway
5. Démarrer Odoo LAB (db + odoo) — DB vide au départ
6. Restaurer le dump dans la base (pas de filestore)
7. Démarrer Linky LAB
8. Lancer backfill DVIG
9. Valider isolation

---

*À compléter avec les informations manquantes.*
