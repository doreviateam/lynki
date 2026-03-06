A) Vérifier que tu es bien sur la bonne image et le bon binaire (Vault)

Sur le host docker :

docker compose -p dorevia_core-stinger_platform ps vault
docker inspect vault-core-stinger --format '{{.Config.Image}}'
docker logs --tail=200 vault-core-stinger

Attendus :

l’image = dorevia/vault:vaulting-routes (ou tag équivalent)

dans les logs au boot, tu dois voir un indice que RegisterVaultingRoutes a bien été exécuté (selon ton code : log “vaulting routes registered” ou au moins absence d’erreur + endpoints actifs).

Si l’image n’est pas la bonne : tu es dans un faux-positif (tu as build mais pas déployé là où tu crois).

B) Vérifier l’outbox DVIG : est-ce que ça forward réellement ?

Tu as déjà la requête SQL. Je te propose une lecture “diagnostic” :

docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT event_id, status, attempt_count, last_error, next_retry_at, updated_at
FROM outbox_events
WHERE event_id='ad2283f7-b410-48df-9272-2148d662dcb4';
"

Interprétation :

1) status = forwarded

➡️ DVIG pense que Vault a accepté. On passe en C.

2) status = failed_soft

➡️ DVIG n’a pas réussi à forward (ou a reçu un code non-2xx).

Regarde last_error : c’est ta vérité.

Puis logs DVIG ciblés :

docker logs --tail=500 dvig-core-stinger | grep -E "ad2283f7|2727|outbox|forward|/api/v1/invoices|/api/v1/events"

Cas typiques :

404 (routes pas là → ancien problème, mais tu as corrigé)

401/403 (auth)

400 (payload rejeté)

500 (panic / erreur handler Vault)

3) status = accepted qui reste “bloqué”

➡️ ton worker DVIG ne le prend pas (scheduler/cron/lock).

Vérifie qu’il tourne, et que le job déclenche bien :

logs DVIG : “scheduler tick”, “processing outbox”, etc.

si tu as un flag env pour activer le worker / fréquence, check docker-compose.

C) Si DVIG dit “forwarded”, vérifier si Vault a créé un document

Dans Vault DB :

docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT id, tenant, odoo_model, odoo_id, created_at
FROM documents
WHERE odoo_model='account.move' AND odoo_id=2727
ORDER BY created_at DESC
LIMIT 5;
"
1) 0 lignes

➡️ Vault n’a pas créé de document, malgré un “forwarded”.
Ça arrive si :

DVIG a marqué forwarded sur une condition trop large (ex : “request sent” mais réponse non lue) — moins probable

DVIG a posté sur un autre tenant / autre DB / autre vault

Vault a répondu 201 mais la transaction DB a rollback (erreur ensuite)

Le handler POST /api/v1/invoices n’écrit pas dans documents pour ce type précis (mapping event_type, etc.)

Action immédiate : regarder logs Vault sur la fenêtre du forward.

docker logs --tail=500 vault-core-stinger | grep -E "POST|/api/v1/invoices|ad2283f7|2727|invoice.posted|tenant|error|WARN|panic"

Et en parallèle, faire un test manuel (très utile) : rejouer l’event depuis DVIG ou envoyer un payload minimal si tu as un exemple.

2) >= 1 ligne existe

➡️ Vault a bien un document. Alors si Odoo reste “pas protégée”, c’est un problème de lookup preuve (ou de tenant).

D) Si document existe : vérifier pourquoi GET /proof/account_move/2727 ne le retrouve pas

Tu as noté : GetDocumentBySourceID cherche odoo_model='account.move' AND odoo_id::text='2727'.

👉 Donc on doit vérifier 3 choses :

D1) Tenant exact

Ta table documents a un champ tenant. Or côté API, tu utilises très probablement un X-Tenant et tu scopes les requêtes.

Vérifie en DB : le tenant du document.

Vérifie ce que l’API reçoit : X-Tenant côté Odoo quand il appelle /proof.

Test : fais un curl avec X-Tenant explicitement.

curl -i \
  -H "X-Tenant: core-stinger" \
  https://vault.core-stinger.doreviateam.com/api/v1/proof/account_move/2727

(refais avec la valeur tenant que tu vois en DB, ex: core-stinger, stinger, sarl-la-platine, etc.)

👉 Si avec le bon tenant ça passe en 200, tu as trouvé : Odoo appelle avec un tenant différent (ou pas de tenant → tenant par défaut).

D2) odoo_model exact : account.move vs account_move

Tu as un endpoint /proof/account_move/:id mais tu stockes odoo_model='account.move'.

Selon ton handler proof.go, il peut faire une conversion (account_move → account.move)… ou pas.

Donc : dans proof.go, check si tu fais un mapping du segment account_move vers account.move.

S’il n’y en a pas : la route fonctionne mais cherche le mauvais modèle.

Fix simple : normaliser model côté endpoint :

accepter account_move et account.move

convertir _ → . avant lookup (ou utiliser une table de mapping whitelist)

D3) odoo_id type / casting

Tu dis que lookup cast odoo_id::text='2727' — ok si odoo_id est int en DB.
Mais attention : si ingestion stocke odoo_id en string dans un autre champ (ou source_id), ou si odoo_id est BIGINT mais ok aussi.

➡️ Vérifie le schéma réel :

docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "\d+ documents"
E) Le symptôme “attempt_count augmente mais jamais protégée” : conclusion la plus probable

Vu ton récit :

avant : routes manquantes → DVIG échoue

après : routes présentes → mais la preuve renvoie encore 404 (Proof not found)

La probabilité la plus haute maintenant, c’est :

✅ Document pas créé (outbox forwarded = faux, ou posted ailleurs, ou handler rejette)

ou

✅ Tenant mismatch (document créé pour un tenant, proof demandé sur un autre)

C’est exactement pour ça que je te pousse sur :

outbox_events status + last_error

documents row exists + tenant

curl proof avec X-Tenant exact

En général, en 5 minutes, tu as un verdict net.

F) Patch “observabilité minimale” (à faire tout de suite dans Vault & DVIG)

Pour arrêter de “deviner”, ajoute juste 2 logs structurés :

Dans Vault, sur POST /api/v1/invoices

Log :

tenant reçu

odoo_model / odoo_id

event_id

résultat : document_id

Dans Vault, sur GET /api/v1/proof/...

Log :

tenant reçu

model normalisé

id

résultat : found / not found

Dans DVIG, au forward

Log :

event_id

url appelée

tenant envoyé

status_code retour

body si non-2xx (tronqué)

Ça transforme ce sujet en debug “évident”.

G) Petit check Odoo (connecteur) : pourquoi la facture ne passe jamais “Protégée” ?

Côté Odoo, la transition “Protégée” dépend typiquement de :

succès d’un GET proof (200) + mise à jour champs (receipt hash, date, etc.)

ou réception d’un ack webhook

Donc tant que GET proof renvoie 404, Odoo reste en “en attente”.

Le test final : une fois que GET proof répond 200, tu relances l’action “Sécuriser maintenant” et tu dois voir :

champ status = protected

champ proof_id / hash / timestamp rempli