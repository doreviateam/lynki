# Ticket 1 — Audit payloads billetterie HelloAsso (trame d’exécution)

| | |
|---|---|
| **Référence** | [Plan d’implémentation](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) §5 bis — Ticket 1 |
| **Usage** | Remplir **pendant** le spike ; ne pas versionner de JSON **non anonymisés** |

---

## Question directrice

> **Comment récupère-t-on les JSON billetterie réels le plus vite possible ?**

Pistes (à combiner selon accès réels) :

1. **Back-office / prévisualisation HelloAsso** — export, détail commande, écran technique si proposé par la plateforme.
2. **API partenaire HelloAsso** — authentification type OAuth2 (le module adhérent utilise `https://api.helloasso-sandbox.com` / `https://api.helloasso.com` ; **les ressources billetterie peuvent différer** — à valider sur la doc API et les scopes du compte).
3. **Jeu de test documenté** — une commande sandbox **payée**, puis appels ciblés sur les IDs connus.
4. **Dernière option** — capture HTTP (outils dev, proxy) **uniquement** si la politique sécurité / contrat du compte l’autorise ; ne jamais commiter les traces brutes.

---

## Checklist d’exécution

### 1. Capturer les payloads

- [ ] **Commande** — une commande réelle de test billetterie.
- [ ] **Paiement** — payload lié à cette commande (ou champs paiement dans le même objet, selon API).
- [ ] **Participants / billets** — selon ce que l’API ou l’export livre (objet dédié ou imbriqué).
- [ ] **Si utile** — **formulaire** et/ou **événement** source (pour contexte LGZ / rattachement).

Déposer les fichiers **anonymisés** sous [`audit_payloads_ticket1/`](./audit_payloads_ticket1/) avec des noms du type :

- `order_sample_01.json`
- `payment_sample_01.json` *(ou fusion dans la commande — le noter)*
- `participants_sample_01.json` ou `tickets_sample_01.json`
- `form_sample_01.json` / `event_sample_01.json` *(optionnel)*

### 2. Anonymiser

Remplacer de façon **cohérente** (même faux email pour la même personne sur tous les fichiers) :

- [ ] noms, prénoms
- [ ] emails
- [ ] téléphones
- [ ] adresses postales
- [ ] toute autre **donnée personnelle** ou identifiant interne non nécessaire à la compréhension technique

### 3. Table de mapping brouillon

Remplir le tableau ci-dessous (copie possible vers tableur). Une ligne = un champ ou un chemin JSON pertinent.

### 4. Mettre à jour l’ADR

- [ ] **Idempotence MVP** : `order.id` seul **ou** clé composée — **décision écrite** dans [ADR billetterie](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md).
- [ ] **Support minimal des participants** (provisoire) — **décision écrite** dans l’ADR.

### 5. Décision GO / NO-GO Sprint 1

- [ ] **GO Sprint 1** — payloads assez clairs pour le socle module + lecture API.
- [ ] **Spike prolongé** — ambiguïtés ou données insuffisantes ; noter **ce qui manque** avant une nouvelle itération.

**Décision consignée le :** _______________  
**Par :** _______________  
**Texte court :**

---

## Table de mapping brouillon HelloAsso → Odoo

*Colonnes : objet ou chemin côté HelloAsso · exemple observé (anonymisé / type) · cible Odoo envisagée · obligatoire MVP ? · remarque / arbitrage.*

| Objet / champ HelloAsso (ex. chemin JSON) | Exemple observé | Cible Odoo envisagée | Obligatoire MVP ? | Remarque / arbitrage |
|-------------------------------------------|-----------------|----------------------|-------------------|----------------------|
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |

*(Ajouter des lignes au besoin.)*

---

## Rappel — clôture Ticket 1

Le ticket est clos lorsque : payloads anonymisés déposés · tableau de mapping rempli (brouillon acceptable) · ADR mis à jour · GO ou NO-GO écrit. Voir [plan §5 bis — conditions minimales](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md).
