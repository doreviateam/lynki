# Pourquoi le vaultage ne marche pas (core lab) — explication simple

## La chaîne du vaultage

Pour qu’une facture soit « vaultée », 3 étapes doivent réussir :

```
1. Odoo  →  envoie la facture à DVIG  (POST /ingest)
2. DVIG  →  envoie le document à Vault (POST /api/v1/events ou /invoices)
3. Odoo  →  demande la preuve à Vault (GET /api/v1/proof/account_move/:id)
```

Si une étape échoue, la suivante ne peut pas réussir.

---

## Ce qui s’est passé sur core lab

1. **Vault (vault-core) plantait au démarrage**  
   Erreur : « JWS required but no keys provided ».  
   Donc Vault ne tournait pas (ou redémarrait en boucle).

2. **Quand Odoo envoyait la facture à DVIG**  
   DVIG recevait bien la facture, puis essayait de l’envoyer à Vault.  
   Mais Vault était indisponible → l’envoi échouait → **le document n’a jamais été enregistré** dans la base Vault.

3. **Quand Odoo demandait la preuve**  
   Odoo appelait : `GET https://vault.core.doreviateam.com/api/v1/proof/account_move/2`  
   Vault répondait 500 « Failed to retrieve proof » ou 502 (Bad Gateway) parce que :
   - soit Vault ne tournait pas (502),
   - soit Vault tournait mais **n’avait pas ce document en base** (500).

4. **Vérification faite**  
   La base Vault core a été interrogée : **aucun document** de type `account.move` n’y est stocké.  
   Donc les factures 2, 3, etc. n’ont jamais été enregistrées dans Vault pour core lab.

---

## Ce qui a été corrigé

- **JWS_REQUIRED=false** a été ajouté pour vault-core → Vault démarre correctement.
- **Migration SPEC 1** dans le code → la table Vault a les bonnes colonnes.
- **DVIG_INTERNAL_TOKEN** ajouté au docker-compose core → DVIG accepte `/internal/outbox/process`.
- **dorevia.dvig.internal.token** doit être configuré dans Odoo (même valeur) → sans ça, les événements ne sont pas poussés de DVIG vers Vault.

Donc **Vault est opérationnel** et **DVIG peut traiter l’outbox** si le token interne est configuré côté Odoo.  
Le blocage n’est plus « Vault qui plante », mais « les anciennes factures n’ont jamais été enregistrées ».

---

## Que faire maintenant

### Option A — Tester avec une **nouvelle** facture (recommandé)

1. Dans Odoo core lab : créer une **nouvelle** facture client.
2. La **valider** (poster).
3. Attendre quelques secondes (job) ou quelques minutes (CRON).
4. Vérifier sur la fiche facture : le bloc « Dorevia Vault » doit passer à **vaulted**.

Si ça marche, la chaîne Odoo → DVIG → Vault est bonne ; seules les **anciennes** factures (créées quand Vault était down) restent sans preuve.

### Option B — Renvoyer les anciennes factures vers Vault

Pour les factures déjà en échec (ex. 2, 3), il faut les **renvoyer** dans le flux :

1. Dans Odoo : **Paramètres → Technique → Base de données → Structure** (ou via script/debug) :  
   remettre le champ **Statut vault** à `todo` pour les factures concernées (ex. FAC/2026/00002, 00003).
2. Déclencher le job d’envoi vers DVIG (ou attendre le CRON) :  
   les factures en `todo` seront renvoyées à DVIG, puis DVIG les enverra à Vault.
3. Ensuite Odoo demandera à nouveau la preuve ; cette fois Vault aura le document et pourra répondre.

(Si le connecteur expose un bouton « Renvoyer vers DVIG » ou « Réessayer », l’utiliser pour ces factures.)

---

## En résumé

| Question | Réponse |
|----------|--------|
| Pourquoi ça ne marchait pas ? | Vault plantait (JWS). Les factures n’ont jamais été enregistrées dans Vault. |
| Pourquoi 502 puis 500 ? | 502 = Caddy ne joignait pas Vault (Vault down). 500 = Vault répond mais n’a pas le document en base. |
| Est-ce que c’est réparé ? | Oui pour Vault (démarrage + schéma). Les **nouvelles** factures peuvent être vaultées. |
| Et les anciennes factures ? | Il faut les renvoyer dans le flux (statut `todo` + job/CRON) ou les laisser en échec. |
