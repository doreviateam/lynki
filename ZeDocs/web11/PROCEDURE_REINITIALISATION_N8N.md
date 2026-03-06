# Réinitialisation n8n — instance vierge (core / lab)

**Objectif** : repartir de zéro (conteneurs + volumes + DB supprimés), recréer le compte owner une seule fois.

**Contexte** : tenant `core`, env `lab` → URL https://n8n.lab.core.doreviateam.com

---

## 1. Arrêter et détruire l’instance (avec purge des volumes)

Depuis la racine du dépôt :

```bash
cd /opt/dorevia-plateform

# Arrêt + suppression des conteneurs et des volumes
bin/dorevia.sh app destroy n8n lab core --purge
```

---

## 2. Définir une clé de chiffrement stable

Créer le fichier `.env` pour que le prochain déploiement utilise une vraie `N8N_ENCRYPTION_KEY` (32+ caractères) :

```bash
mkdir -p tenants/core/apps/n8n/lab

# Générer une clé (64 caractères hex) et l’écrire dans .env
echo "N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)" > tenants/core/apps/n8n/lab/.env
```

**Important** : ne pas perdre cette clé (backup sécurisé). Si vous la changez plus tard, les credentials déjà créés dans n8n ne seront plus déchiffrables.

---

## 3. Re-générer le compose et redémarrer

```bash
# Régénérer le docker-compose (lit N8N_ENCRYPTION_KEY depuis .env)
bin/dorevia.sh render core --env lab

# Redémarrer n8n
bin/dorevia.sh app up n8n lab core
```

---

## 4. Créer le compte owner (une seule fois)

1. Ouvrir **https://n8n.lab.core.doreviateam.com**
2. Vous devez voir la page **« Set up owner account »** (pas « Sign in »).
3. Remplir : **Email**, **First Name**, **Last Name**, **Password** (8+ caractères, au moins 1 chiffre et 1 majuscule).
4. Cliquer sur **Next** et terminer l’assistant.
5. **Noter le mot de passe** : en self-hosted, « Forgot my password » ne réinitialise pas toujours le compte owner.

---

## 5. Vérification

- Connexion possible avec l’email et le mot de passe choisis.
- Ensuite : importer le workflow `units/n8n/workflows/webhook-echo.json`, l’activer, tester avec `./scripts/test_n8n_webhook.sh core lab --public`.

Voir aussi : `DIAGNOSTIC_INSTALLATION_N8N.md`, `TROUBLESHOOTING_SSL_N8N_LAB_CORE.md` §6.
