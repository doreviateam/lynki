# Recette lab — MVP HelloAsso → Odoo (`res.partner`)

> **Code actuel** : le module `dorevia_helloasso_adherent` a été **retiré du dépôt**. Utiliser **`dorevia_helloasso_members`** / **`dorevia_helloasso_connector`** pour les commandes d’installation et les chemins de code.

**Version compacte (ticket / PR, une page)** : `RECETTE_MVP_HELLOASSO_COMPACT.md`

## Décision de validation proposée

- MVP synchro HelloAsso → `res.partner` : **validable**
- Scénarios bloquants couverts : §1, §2, §3, §4
- Point restant non bloquant : §5 variation de payload
- La recette manuelle détaillée du §3 reste optionnelle si la CI Python est verte

---

Document utilisable tel quel dans un ticket ou une PR de validation.  
**Ordre recommandé** : synchro nominale et rejouabilité d’abord ; les scénarios doublons et payload ensuite.

**Environnement** : lab (ex. `glz-rgl`), base dédiée, credentials HelloAsso sandbox ou prod selon le périmètre.

**Dernière mise à jour** : avril 2026 — aligné sur `dorevia_helloasso_members`, `dorevia_helloasso_connector` et `dorevia_partner_membership_fields` (synchro MVP, conversion montants).

### État de validation (2026-04-03)

| Zone | Statut |
|------|--------|
| §1 Cas nominal | OK — lab (`glz-rgl`) + tests auto (`test_helloasso_mvp`) |
| §2 Rejouabilité | OK — lab + tests auto |
| §3 Rapprochement par email | **Comportement synchro** OK — tests auto ; checklist **manuelle** §3 (préparation pas à pas) **non exigée** si les tests CI passent |
| §4 Doublon d’email | **Comportement attendu** OK — tests auto ; recette manuelle optionnelle |
| §5 Variation de payload | **Non** couvert par les tests auto — à faire au besoin |

Les cases `[x]` ci-dessous suivent ce tableau (les étapes uniquement **terrain** du §3 restent en `[ ]` tant qu’on ne les a pas rejouées à la main).

### Rappels produit (comportement actuel)

- **Montants** : l’API HelloAsso envoie des **centimes** ; le champ partenaire **HelloAsso — montant (€)** stocke des **euros** (ex. API `1000` → **10,00** affiché).
- **Prévisualisation** : Paramètres → **Prévisualiser les données** — rapport texte + **tableaux** chemin/valeur pour les réponses orders/payments.
- **Onglet HelloAsso** sur la fiche contact : réservé au groupe **Paramètres / Administration** (`base.group_system`) ; l’onglet **Adhésion** reste séparé.

---

## Préparation (une fois par session)

- [x] **Prévisualiser les données HelloAsso** (Paramètres → HelloAsso) : connexion OK.
- [x] Noter pour référence : `formType`, `formSlug`, exemple `order.id`, exemple `payment.id` (cohérence avec la SPEC / audit).

---

## 1. Cas nominal

**Contexte** : un adhérent HelloAsso qui **n’existe pas** encore dans Odoo (nouvel email côté HelloAsso, aucun contact correspondant).

- [x] Lancer **Synchroniser les adhérents**.
- [x] Ouvrir le **contact** créé.

**À vérifier**

- [x] Partenaire **créé** (une seule fiche attendue pour ce cas).
- [x] **Email**, **prénom**, **nom** alignés avec HelloAsso.
- [x] `helloasso_external_id` **renseigné**.
- [x] `helloasso_order_id` **renseigné**.
- [x] `helloasso_source_form` **renseigné** (slug ou identifiant attendu par le produit).
- [x] `helloasso_sync_status` : valeur technique **`synced`**, libellé interface **Synchronisé**.
- [x] `helloasso_payment_amount` cohérent en **euros** (pas la valeur brute centimes dans ce champ).

---

## 2. Rejouabilité

**Contexte** : **sans rien changer** côté HelloAsso ni Odoo, relancer uniquement la synchro.

- [x] Lancer de nouveau **Synchroniser les adhérents**.

**À vérifier**

- [x] **Aucun doublon** de partenaire pour le même adhérent.
- [x] **Même partenaire** repris (même `id` Odoo).
- [x] Pas d’effet de bord inattendu (champs non vidés, pas de création fantôme).

---

## 3. Rapprochement par email

<!-- id: 0l18aq — scénario détaillé §3 -->

**Comportement (rapprochement par email sans `helloasso_external_id`)** : validé par tests auto `TestHelloassoSyncMvp.test_scenario_3_email_match_updates_existing_without_create` (base `test_helloasso_mvp`, 2026-04-03).

### Objectif

Vérifier que la synchro HelloAsso **n’entraîne pas la création d’un nouveau contact** lorsqu’un partenaire Odoo existe déjà avec le **même email**, et qu’elle **enrichit la fiche existante** avec les champs HelloAsso.

---

### Préparation

- [ ] Choisir un adhérent HelloAsso de référence déjà présent dans le sandbox
- [ ] Noter l’email de référence (ex. `daniel@norab.fr`)
- [ ] Lancer **Prévisualiser les données HelloAsso**
- [ ] Vérifier qu’on retrouve bien :
  - [ ] un formulaire `Membership`
  - [ ] au moins **1 commande**
  - [ ] au moins **1 paiement**

---

### Préparation du contact Odoo

- [ ] Créer un **nouveau contact Odoo**
- [ ] Renseigner **exactement le même email** que l’adhérent HelloAsso
- [ ] Laisser les champs HelloAsso vides :
  - [ ] `helloasso_external_id`
  - [ ] `helloasso_order_id`
  - [ ] `helloasso_source_form`
  - [ ] `helloasso_form_type`
  - [ ] `helloasso_payment_date`
  - [ ] `helloasso_payment_mean`
  - [ ] `helloasso_payment_amount`
  - [ ] `helloasso_sync_status`
- [ ] Vérifier qu’il n’existe **qu’un seul** contact Odoo avec cet email

---

### Exécution

- [ ] Aller dans **Paramètres → HelloAsso**
- [ ] Cliquer sur **Synchroniser les adhérents**

---

### Résultat attendu — notification

- [x] **0 création** *(attendu / couvert tests auto §3)*
- [x] **1 mise à jour**
- [x] **0 ignoré**
- [x] Notification cohérente avec un rapprochement par email

---

### Résultat attendu — fiche partenaire

- [x] Ouvrir la **même fiche contact** *(comportement : pas de nouveau `res.partner` — tests auto)*
- [x] Vérifier qu’aucun nouveau partenaire n’a été créé
- [x] Vérifier que la fiche existante a été enrichie avec :
  - [x] `helloasso_external_id`
  - [x] `helloasso_order_id`
  - [x] `helloasso_source_form`
  - [x] `helloasso_form_type`
  - [x] `helloasso_payment_date`
  - [x] `helloasso_payment_mean`
  - [x] `helloasso_payment_amount`
  - [x] `helloasso_sync_status` (**Synchronisé** / `synced`)

---

### Vérifications métier

- [x] Email correct et inchangé
- [x] Prénom / nom correctement conservés ou complétés
- [x] `helloasso_payment_amount` affiché dans la bonne unité métier
  - [x] **10,00 €**
  - [x] et non **1000,00**

---

### Cas non validant

Le scénario est **à corriger** si :

- [ ] un **nouveau contact** a été créé
- [ ] la fiche existante n’a pas été rapprochée
- [ ] les champs HelloAsso sont restés vides
- [ ] plusieurs fiches ont été touchées
- [ ] la notification annonce une création au lieu d’une mise à jour

---

### Résultat observé

- [x] Scénario validé *(comportement : tests auto + alignement lab sur montants €)*
- [ ] Scénario à corriger

**Notification observée**

- Créations : `0` *(tests auto / logique §3)*
- Mises à jour : `1`
- Ignorés : `0`

**Contact testé**

- Nom / libellé : *recette auto (`Contact pré-existant`)*
- Email : *domaine `s3_existing@test.dorevia.local` en test ; lab : reprendre votre email terrain si besoin*

**Remarques**

- Recette **manuelle** pas à pas (blocs *Préparation* ci-dessus) reste possible pour une **preuve terrain** ; les cases `[ ]` des sections *Préparation* / *Préparation du contact* restent ouvertes pour ça.

Ensuite : scénario **doublon d’email** (§4).

---

## 4. Doublon d’email côté Odoo

**Contexte** : **deux** partenaires Odoo avec le **même email** (création volontaire pour le test), pour un paiement HelloAsso qui correspondrait à cet email.

- [x] Lancer **Synchroniser les adhérents**. *(comportement validé par tests auto §4)*

**Comportement attendu (MVP actuel dans le code)**

- [x] Le paiement concerné est **ignoré** pour le rapprochement par email (ambiguïté) : compteur **Ignorés** augmenté dans la notification.
- [x] **Aucune** création ni **aucun** `write` sur les partenaires en conflit pour ce paiement (pas de choix arbitraire de fiche).
- [x] **Logs serveur** Odoo avec un avertissement du type *email ambigu* (vérifier les logs du conteneur / fichier Odoo si besoin).

**Notification** : il est possible d’avoir à la fois **Paiements éligibles traités : 1** et **Ignorés : 1** (le paiement compte dans « traités » puis est classé en « ignoré » faute de rapprochement sûr). **Créations** et **mises à jour** doivent rester à **0** pour ce scénario.

**Note** : la valeur **`pending_review`** existe sur le modèle mais **n’est pas posée automatiquement** par la synchro MVP à ce stade ; une évolution pourrait l’utiliser pour signaler les cas à traiter manuellement.

---

## 5. Variation de payload

**Contexte** : autre inscription ou paiement si possible (autre mode, autre état, autre structure `items`).

**À vérifier**

- [ ] Filtre métier (**ex. Registered**, Membership) : comportement conforme à l’ADR / SPEC.
- [ ] Présence ou absence de **`items`** : pas de plantage ; comportement défini.
- [ ] Champ **manquant** dans la réponse API : gestion propre (skip, log, statut).

---

## Synthèse « à valider en premier »

1. **Synchro nominale** (§1) — le plus structurant.  
2. **Rejouabilité** (§2) — stabilité du connecteur.  
3. Ensuite : **email préexistant** (§3), **doublons Odoo** (§4), **payload** (§5).

---

## Fin de session — ticket court

Après la recette, noter dans le ticket :

- Date, environnement (URL / base).
- Scénarios **OK** / **KO** (référence §).
- Pour chaque KO : **comportement observé**, **comportement attendu**, capture ou extrait de log si utile.

---

## Références code / doc

- Modules : `dorevia_helloasso_members`, `dorevia_helloasso_connector`, `dorevia_partner_membership_fields`, `dorevia_res_config_dms_shim`.
- SPEC : `SPEC_DOREVIA_HELLOASSO_ADHERENT.md` — ADR : `ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md`.
- Logique synchro (rapprochement, skip doublon email) : `dorevia_helloasso_members/models/helloasso_sync.py`.

### Tests automatisés (Python)

Le module `dorevia_helloasso_members` embarque des tests Odoo (`tests/test_helloasso_sync.py`) qui rejouent les scénarios §1 à §4 avec **mocks** des appels API (pas de sandbox, pas de réseau).

**Recommandation** : utiliser une **base PostgreSQL dédiée** (ex. `test_helloasso_mvp`) où seuls les modules nécessaires sont installés. Sur une grosse base lab (`odoo_lab_glz_rgl`), le chargement des tests d’**autres** addons peut échouer (ex. `odoo_test_helper` incompatible Odoo 19, dépendances manquantes).

Sur l’hôte Docker du lab (conteneur Odoo, config `ODOO_RC=/etc/odoo/odoo.conf`) :

```bash
# Une fois : créer la base minimale (écrase si déjà présente)
ODOO_RC=/etc/odoo/odoo.conf odoo db init test_helloasso_mvp --force

# Une fois : installer la chaîne (members entraîne connector et dépendances)
ODOO_RC=/etc/odoo/odoo.conf odoo module install -d test_helloasso_mvp dorevia_helloasso_members

# À chaque exécution des tests (--db-filter pour ne pas être bloqué par dbfilter du lab)
ODOO_RC=/etc/odoo/odoo.conf odoo server -d test_helloasso_mvp \
  --db-filter='^test_helloasso_mvp$' \
  --test-enable --stop-after-init \
  --test-tags=/dorevia_helloasso_members \
  --workers=0 --http-port=8070
```

Attendu dans les logs : `0 failed` / `post-tests` OK pour `dorevia_helloasso_members`.

La recette **manuelle** reste utile pour valider credentials réels, prévisualisation et comportement UI.

---

## Synthèse validation PR / ticket (copier-coller)

**Objet** : validation MVP HelloAsso → `res.partner` (lab + tests auto).

**Décision** : MVP **validable** pour fusion / mise en production selon votre processus.

**Couvert** : §1 nominal, §2 rejouabilité, §3 rapprochement email (comportement), §4 doublon d’email ignoré — **lab** et/ou **`tests/test_helloasso_mvp` verts** (`dorevia_helloasso_members`).

**Non bloquant** à ce stade : §5 variation de payload ; ouvrir un ticket si un cas métier doit être approfondi.

**Montants** : API en centimes, Odoo en euros (champ **HelloAsso — montant (€)**).

**§3** : la checklist manuelle pas à pas reste une **preuve complémentaire** ; elle n’est pas un prérequis si les tests Python passent.

**Réfs** : `SPEC_DOREVIA_HELLOASSO_ADHERENT.md`, `ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md`, modules `dorevia_helloasso_members`, `dorevia_partner_membership_fields`.
