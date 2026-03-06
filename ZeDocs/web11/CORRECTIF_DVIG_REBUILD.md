# Pourquoi rien ne va — et la seule correction nécessaire (DVIG, pas Vault)

## Ce qui bloque

1. **Vault** : OK (démarre, répond). Aucun changement à faire côté Vault.
2. **Odoo** : OK (config avec `dorevia.dvig.internal.token` = `dvig_internal_core_lab`).
3. **DVIG** : l’image actuelle **dorevia/dvig:0.1.2-auth** ne contient **pas** la route `/internal/outbox/process`.  
   → Odoo appelle cette URL, DVIG répond **404**.  
   → L’outbox n’est jamais traitée, les documents n’arrivent jamais dans Vault.

Donc le blocage vient **uniquement de l’image DVIG** (trop ancienne ou construite sans cette route). Il faut **reconstruire l’image DVIG** à partir du code actuel. **Aucun nouveau serveur Vault à refaire.**

---

## Ce qu’il faut faire (reconstruire uniquement DVIG)

À exécuter **depuis la racine du projet** (là où se trouve `bin/dorevia.sh`).

### 1. Reconstruire l’image DVIG

```bash
cd /opt/dorevia-plateform/sources/dvig
docker build -f docker/Dockerfile -t dorevia/dvig:0.1.2-auth .
```

Attendre la fin du build (sans erreur).

### 2. Redémarrer uniquement DVIG (pas Vault)

```bash
cd /opt/dorevia-plateform/tenants/core/platform
docker compose -p dorevia_core_platform up -d dvig
```

Cela recrée **dvig-core** avec la nouvelle image. Vault et les autres services ne sont pas touchés.

### 3. Tester

1. Dans Odoo : ouvrir une facture en « Protection en cours » (ex. FAC/2026/00005) ou en créer une nouvelle et la valider.
2. Soit attendre la prochaine exécution du job (quelques minutes), soit déclencher le worker DVIG si un bouton ou une action existe.
3. Vérifier que le statut vault passe à **vaulted**.

---

## En résumé

| Composant | État | Action |
|-----------|------|--------|
| Vault | OK | Rien à faire |
| Odoo | OK | Rien à faire |
| DVIG | Image sans `/internal/outbox/process` | **Reconstruire l’image** puis redémarrer le conteneur `dvig` |

Aucun serveur Vault à refaire : on ne touche qu’à **DVIG** (build + redémarrage du conteneur).
