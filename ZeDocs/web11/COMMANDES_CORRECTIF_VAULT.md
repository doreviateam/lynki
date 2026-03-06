# Appliquer le correctif Vault (migration SPEC 1) — pas à pas

À faire **depuis la racine du projet** (là où se trouve `bin/dorevia.sh`, en général `/opt/dorevia-plateform`).

---

## Étape 1 — Reconstruire l’image Vault

Ouvrir un **terminal**, puis taper :

```bash
cd /opt/dorevia-plateform/sources/vault
docker build -t dorevia/vault:v1.3.0 .
```

Appuyer sur **Entrée**. Attendre la fin du build (plusieurs lignes qui défilent, puis retour au prompt). S’il y a une erreur en rouge, la copier et la transmettre.

---

## Étape 2 — Redémarrer la plateforme core

Dans le même terminal (ou un nouveau), aller à la **racine du projet** et lancer :

```bash
cd /opt/dorevia-plateform
bin/dorevia.sh platform down core
bin/dorevia.sh platform up core
```

Cela arrête puis redémarre les conteneurs DVIG et Vault pour core. Au démarrage, Vault applique la migration SPEC 1 sur la base.

---

## Étape 3 — Tester

1. Ouvrir **https://odoo.lab.core.doreviateam.com** dans le navigateur.
2. Aller sur une facture client (ex. FAC/2026/00002).
3. Si le statut vault est encore en échec : relancer le job de preuve (ou créer et valider une **nouvelle** facture).
4. Vérifier que le statut passe à **vaulted**.

Si l’erreur continue, afficher les dernières lignes des logs Vault :

```bash
docker logs vault-core 2>&1 | tail -50
```

Copier le résultat et le transmettre pour analyse.
