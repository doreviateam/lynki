# Tests webhook n8n — Import et exécution (Sprint 3)

**Objectif** : Valider l’import du template `webhook-echo.json` et l’exécution du webhook (flow A minimal).

---

## 1. Prérequis

- n8n démarré pour le tenant : `dorevia.sh app up n8n <env> <tenant>` (ex. `lab core` pour **core**).
- Accès à l’interface n8n : `https://n8n.<env>.<tenant>.doreviateam.com` (ex. **`https://n8n.lab.core.doreviateam.com`**). Créer le DNS chez OVH si besoin : voir `ZeDocs/web11/DNS_OVH_N8N_LAB_CORE.md`. **Ou** test en interne (script sans `--public`).

---

## 2. Import du workflow (manuel)

L’import via CLI (`n8n import:workflow`) depuis un `docker exec` peut échouer (auth DB en contexte one-shot). Procédure recommandée : **import depuis l’UI**.

1. Ouvrir n8n : **`https://n8n.lab.core.doreviateam.com`** (tenant **core**, env **lab**). Si vous utilisez un autre tenant/env, adapter l’URL. Créer le DNS chez OVH : `ZeDocs/web11/DNS_OVH_N8N_LAB_CORE.md`.
2. Menu (⋮) en haut à droite → **Import from File**.
3. Choisir le fichier : `units/n8n/workflows/webhook-echo.json`.
4. Vérifier les nœuds : **Webhook** (POST, path `web-to-lead`) → **Respond to Webhook**.
5. **Activer** le workflow (toggle en haut à droite) pour que l’URL de production soit enregistrée.
6. Copier l’**URL de production** du nœud Webhook (ex. `https://n8n..../webhook/web-to-lead`).

---

## 3. Test du webhook

### 3.1 Via script (réseau interne — sans DNS)

Depuis la machine hôte, le script appelle le conteneur n8n sur le réseau Docker :

```bash
./scripts/test_n8n_webhook.sh core lab
```
(Remplacez par votre tenant/env, ex. `lab lab` si vous utilisez le tenant lab.)

- **Prérequis** : workflow importé et **activé** dans n8n.
- **Succès** : HTTP 200 et réponse contenant `"received"`.
- **404** : workflow non importé ou non activé → suivre §2.

### 3.2 Via script (URL publique — avec DNS/hosts)

Si `n8n.<env>.<tenant>.doreviateam.com` est configuré (DNS ou /etc/hosts) :

```bash
./scripts/test_n8n_webhook.sh core lab --public
```
(Requiert que `n8n.lab.core.doreviateam.com` soit configuré en DNS, ex. chez OVH.)

### 3.3 Via curl manuel

**Réseau interne** (depuis un conteneur sur `dorevia-network` ; remplacer `core` par votre tenant) :

```bash
docker run --rm --network dorevia-network curlimages/curl -s -X POST \
  http://n8n_lab_core:5678/webhook/web-to-lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'
```

**URL publique** (si DNS configuré, ex. OVH pour `n8n.lab.core.doreviateam.com`) :

```bash
curl -s -X POST "https://n8n.lab.core.doreviateam.com/webhook/web-to-lead" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'
```

Réponse attendue : `{"received":true,"message":"web-to-lead placeholder"}` (ou équivalent selon le template).

---

## 4. Résultat observé (sans import)

Sans workflow importé/activé, le script renvoie :

- **HTTP 404** avec message n8n : *"The requested webhook \"POST web-to-lead\" is not registered."*
- Indication : activer le workflow (toggle en haut à droite de l’éditeur).

Après import + activation, le même appel doit renvoyer **HTTP 200** et un JSON contenant `"received"`.

---

## 5. Checklist

- [ ] n8n démarré (`app status n8n lab core` ou `lab lab` selon tenant).
- [ ] (Si accès public) DNS créé chez OVH : `n8n.lab.core` → voir `DNS_OVH_N8N_LAB_CORE.md`.
- [ ] Workflow `webhook-echo.json` importé dans n8n (Import from File).
- [ ] Workflow activé (toggle).
- [ ] `./scripts/test_n8n_webhook.sh lab lab` → OK (HTTP 200, `"received"`).
- [ ] (Optionnel) Test avec `--public` si DNS/hosts configuré.
