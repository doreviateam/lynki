# Runbook — Déployer le cockpit Linky sur laplatine2026

**Problème :** `/cockpit` renvoie 404 car l'image Linky déployée (`dorevia/linky:laplatine-ytd-2026-03-10`) a été construite avant l'ajout de la page cockpit.

**Solution :** Reconstruire l'image Linky et redéployer.

---

## 1. Reconstruire l'image Linky

Depuis la racine du dépôt :

```bash
docker build -t dorevia/linky:cockpit-2026-03-13 \
  -f units/dorevia-linky/Dockerfile \
  units/dorevia-linky
```

---

## 2. Mettre à jour le docker-compose laplatine2026

Éditer `tenants/laplatine2026/apps/ui/lab/docker-compose.yml` :

```yaml
services:
  linky:
    image: dorevia/linky:cockpit-2026-03-13   # ← remplacer laplatine-ytd-2026-03-10
    # ... reste inchangé
```

---

## 3. Redémarrer le conteneur Linky

```bash
cd tenants/laplatine2026/apps/ui/lab
docker compose pull   # si l'image est sur un registry
docker compose up -d --force-recreate linky
```

Si l'image est locale uniquement, `docker compose up -d --force-recreate linky` suffit.

---

## 4. Vérifier

Ouvrir : **https://ui.lab.laplatine2026.doreviateam.com/cockpit**

---

## Option : build local sans registry

Si l'image est construite localement sur la machine qui héberge Docker :

1. Builder l'image sur cette machine
2. Mettre à jour le docker-compose
3. `docker compose up -d --force-recreate linky`

---

*Runbook — Cockpit Linky — Mars 2026*
