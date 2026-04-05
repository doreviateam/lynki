# Refonte HelloAsso — lot 1 (connector) et migration vers `members`

## Lot 1 exécuté (dépôt)

- **Nouveau module** `dorevia_helloasso_connector` : `helloasso_client.py`, `helloasso_sync_log.py` (`dorevia.helloasso.logentry`), vues du journal.
- **`dorevia_helloasso_adherent`** : dépend du connector ; fichiers ci-dessus retirés ; imports pointent vers `dorevia_helloasso_connector`.
- **`dorevia_helloasso_billetterie`** : dépend explicitement du connector ; imports client / journal mis à jour.
- **Script lab** `upgrade-dorevia-odoo-on-host.sh` : install/upgrade **connector avant** adherent ; vérification `logentry` sur le fichier connector.

## Ordre de déploiement obligatoire

1. `dorevia_helloasso_connector` (install ou upgrade)
2. `dorevia_helloasso_adherent` (upgrade)
3. `dorevia_helloasso_billetterie` (install ou upgrade)

Sans connector installé, l’upgrade adherent échoue (imports).

## XML IDs journal

Les vues / action du journal passent de `dorevia_helloasso_adherent.*` à `dorevia_helloasso_connector.*` (ex. `action_dorevia_helloasso_sync_log`). Vérifier les favoris / liens externes.

## Prochain lot — migration `adherent` → `members` (plan)

1. **Créer** `dorevia_helloasso_members` avec `depends`: connector, `dorevia_partner_membership_fields`, `dorevia_res_config_dms_shim`.
2. **Déplacer** depuis adherent : `helloasso_sync.py`, `helloasso_cron.py`, partie Members de `res_config_settings` + vues associées, `ir_cron_data.xml`, tests `test_helloasso_sync.py`.
3. **Shim** `dorevia_helloasso_adherent` : manifest ne dépend plus que de `members` (ou `connector` + `members`), données vides ou fichier XML de redirection ; conserver le nom de module une release pour les bases qui n’ont que `adherent` dans les dépendances tierces.
4. **Renommer** progressivement les libellés « adhérent » → « Members » dans l’UI ; conserver les clés `ir.config_parameter` existantes tant que non migrées (`dorevia_helloasso.*`).
5. **À terme** : fusion optionnelle `dorevia_partner_membership_fields` → `members` (champs + vues partner).
6. **Nettoyage** : retirer le shim adherent quand plus aucune dépendance externe.

## Tests

- Lancer les tests `dorevia_helloasso_adherent` (ils couvrent encore la synchro tant que le code vit dans adherent).
- Après extraction vers `members`, déplacer les tests et le tag `test-tags`.
