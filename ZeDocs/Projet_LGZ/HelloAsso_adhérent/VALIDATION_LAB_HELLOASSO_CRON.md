# Module HelloAsso → Odoo — Dorevia (MVP)

Rapport de référence sur le connecteur **`dorevia_helloasso_adherent`** et son périmètre.  
*(Ce document remplace l’ancienne note courte exclusivement centrée sur le cron ; la **validation lab** du planificateur est résumée en [annexe](#annexe--validation-lab--automatisation-ircron).)*

**Document de référence module** — à mettre à jour uniquement en cas d’évolution réelle du connecteur, de ses dépendances, ou du mode d’automatisation retenu.

---

## À quoi il sert

**`dorevia_helloasso_adherent`** est un **connecteur MVP** entre **HelloAsso** (API v5, adhésions / paiements) et **Odoo** : il ramène les **adhérents éligibles** dans les **contacts** (`res.partner`), avec les **paramètres** et la **traçabilité** prévus dans la spec projet (`SPEC_DOREVIA_HELLOASSO_ADHERENT.md`, ADR associé).

En résumé : **HelloAsso reste le canal public** ; **Odoo** sert de référentiel interne pour ce qui est synchronisé.

---

## Ce que le module contient (fonctionnel)

1. **Paramètres** (Paramètres généraux → bloc HelloAsso)  
   Client ID, secret, **sandbox** ou prod, **slug organisation** — stockés en `ir.config_parameter`.

2. **Tester la connexion**  
   OAuth2 **client_credentials**, puis éventuellement un appel type **formTypes** si le slug est renseigné (validation d’accès API).

3. **Prévisualiser les données HelloAsso**  
   Lecture seule : rapport texte (et extrait JSON utile à l’audit) — **aucune écriture** en base Odoo.

4. **Synchroniser les adhérents**  
   Parcours des objets HelloAsso retenus par la logique MVP de synchronisation (formulaire d’adhésion, commande / paiement selon l’implémentation courante), puis **création / mise à jour** de `res.partner` (rapprochement par email, règles de skip en cas de doublons — logique dans `helloasso_sync.py`).

5. **Automatisation**  
   Tâche **`ir.cron`** (activable ou non) qui relance la **même** synchro que le bouton, avec les mêmes paramètres ; point d’entrée sur le modèle technique `dorevia.helloasso.cron` (`cron_sync_membership_adherents` / `_cron_sync_membership_adherents`).

---

## Ce que le module ne couvre pas tout seul

- Les **champs et l’onglet HelloAsso sur la fiche contact** (montants, identifiants source, statut de synchro, etc.) sont dans **`dorevia_partner_membership_fields`**, dont **`dorevia_helloasso_adherent` dépend** : séparation volontaire pour pouvoir disposer des champs sans forcément installer tout le connecteur API partout.

- **`dorevia_res_config_dms_shim`** est une **dépendance technique** pour la cohérence des écrans Paramètres (champs documents attendus par certaines vues) sur Odoo 19 lorsque **DMS** n’est pas installé.

---

## Côté technique (fichiers utiles dans le module)

| Zone | Rôle |
|------|------|
| `helloasso_client.py` | Appels HTTP vers l’API (jeton, formulaires, commandes, paiements). |
| `helloasso_sync.py` | Logique métier de synchro vers `res.partner`. |
| `helloasso_cron.py` | Entrées planifiées et compatibilité actions serveur. |
| `res_config_settings.py` | Actions des boutons dans Paramètres. |
| `helloasso_preview_wizard.py` | Assistant de prévisualisation. |
| `data/ir_cron_data.xml` | Enregistrement `ir.cron` livré avec le module (fréquence type quotidienne, souvent inactif par défaut). |
| `tests/test_helloasso_sync.py` | Tests avec **mocks** (pas d’appel réseau réel). |

Dépendance Python externe : **`requests`**.

---

## En une phrase

Le module **configure l’API HelloAsso**, permet de **vérifier** et **prévisualiser**, puis de **synchroniser** les adhérents vers les **contacts Odoo**, **manuellement** ou **par cron**, en s’appuyant sur **`dorevia_partner_membership_fields`** pour l’affichage et la traçabilité sur `res.partner`.

---

## Liens documentation

- [SPEC — Connecteur HelloAsso → Odoo (adhérents)](./SPEC_DOREVIA_HELLOASSO_ADHERENT.md)
- [ADR — Arbitrages HelloAsso ↔ Odoo](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md)
- [Positionnement `ir.cron` vs `queue_job`](./POSITIONNEMENT_SYNC_CRON_VS_QUEUE_JOB.md)
- [Recette MVP compacte](./RECETTE_MVP_HELLOASSO_COMPACT.md)

---

## Annexe — Validation lab — automatisation (`ir.cron`)

Le déclenchement automatique de la synchro HelloAsso → Odoo (adhérents) a été **validé sur le lab** via **action planifiée Odoo (`ir.cron`)**.

**Environnement de référence :** lab `glz-rgl` (base `odoo_lab_glz_rgl`), module `dorevia_helloasso_adherent`.

### Résultat de validation lab

- exécution manuelle : **OK**
- action planifiée `ir.cron` : **OK**
- exécution automatique sur le lab : **OK**
- fréquence initiale retenue : **1 fois par jour**

### Décision confirmée

Le palier d’automatisation retenu est **`ir.cron`**. Le recours à **`queue_job`** n’est pas retenu à ce stade et reste un **palier 2 éventuel**, conditionné par le besoin terrain.

### Suivi recommandé

- noter dans le ticket ou la PR que le **test lab du cron est concluant** ;
- surveiller **1 à 2 cycles réels** : logs serveur propres ;
- ne pas introduire de complexité supplémentaire tant qu’aucun besoin terrain ne le justifie.
