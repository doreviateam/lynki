# Pré-spécification — DIVA (Synthèse Linky)

**Version** : 0.1  
**Date** : 2026-02-17  
**Statut** : Expression du besoin — avant SPEC  
**Périmètre** : Synthèse + Points d'attention + Vérifications suggérées (sans DLP)

---

# 1. Expression du besoin

## 1.1 Contexte

L’utilisateur arrive sur la page d’accueil Linky (grille d’icônes : Trésorerie validée, Cash, Business, Taxes, Notes de crédit, Remboursements, Points de vente, Z de caisse). Les chiffres sont affichés, mais il manque une **lecture synthétique** de la situation.

## 1.2 Besoin utilisateur

> Quand j’arrive ici, **DIVA me génère un état de la situation** : une synthèse lisible, des points d’attention, et des vérifications suggérées.

L’utilisateur souhaite :
- **Comprendre rapidement** ce que disent les chiffres
- **Identifier les anomalies** ou incohérences
- **Savoir quoi vérifier** en priorité

## 1.3 Livrable attendu (mockup)

DIVA génère un bloc structuré en trois sections :

| Section | Icône | Contenu |
|---------|-------|---------|
| **Synthèse DIVA** | 🧠 | Résumé de la situation : niveaux de trésorerie, cash, business, taxes ; remarques sur remboursements, notes de crédit, etc. |
| **Points d'attention** | 🔍 | Anomalies ou incohérences détectées (ex. 0 % trésorerie validée, écart Cash/Business, Z de caisse absente) |
| **Vérifications suggérées** | ✓ | Actions concrètes proposées (ex. vérifier rapprochement bancaire, cohérence TVA/Business, intégration POS) |

---

# 2. Données disponibles

## 2.1 Sources (Vault — agrégats)

Les mêmes données que celles affichées par les cartes Linky :

- `GET /ui/aggregations/treasury` — trésorerie, reliability_rate
- `GET /ui/aggregations/payments-in` — encaissements
- `GET /ui/aggregations/payments-out` — décaissements
- `GET /ui/aggregations/sales` — ventes certifiées
- `GET /ui/aggregations/purchases` — achats certifiés
- `GET /ui/aggregations/adjustments` — notes de crédit, remboursements
- `GET /ui/aggregations/pos-sessions` — points de vente
- (Z de caisse : à venir)

## 2.2 Paramètres

- `tenant`, `date_debut`, `date_fin`, `company_id` (optionnel) — alignés sur les filtres Linky.

---

# 3. Contraintes (rappel)

- **DIVA ne génère pas de DLP** (hors scope v1).
- **Pas d’accès direct** à la base Vault — uniquement les APIs.
- **Mistral** : installé localement, `http://mistral-llamacpp:8000/v1`.
- **Données** : lecture seule, aucune écriture sur les preuves.

---

# 4. Questions soulevées

## 4.1 Positionnement produit

| # | Question | Options possibles |
|---|----------|-------------------|
| Q1 | La synthèse doit-elle être **factuelle** (reformulation des chiffres) ou **interprétative** (analyse, jugement) ? | Factuelle / Interprétative / Les deux (avec désambiguïsation) |
| Q2 | Qui assume la responsabilité des « points d’attention » et « vérifications suggérées » ? L’IA propose, l’humain décide — faut-il le rappeler explicitement dans l’UI ? | Oui / Non |
| Q3 | Faut-il limiter la synthèse à des **énoncés neutres** pour éviter toute formulation qui ressemble à un conseil juridique ou comptable ? | Oui / Non |
| Q4 | Quel **ton** pour la synthèse ? (professionnel, sobre, pédagogique, direct ?) | À définir |

## 4.2 UX et parcours

| # | Question | Options possibles |
|---|----------|-------------------|
| Q5 | Où placer le bloc « Synthèse DIVA » ? | Au-dessus de la grille / En dessous / Dans un panneau latéral / Modal (clic) |
| Q6 | Quand générer la synthèse ? | À chaque chargement de la page / Sur demande (bouton) / Les deux |
| Q7 | Gestion du **chargement** : la synthèse prend 3–15 s. Afficher un skeleton / spinner ? Bloquer l’affichage des cartes ? | Skeleton / Spinner / Cartes d’abord, synthèse en différé |
| Q8 | Faut-il permettre de **rafraîchir** la synthèse sans recharger la page ? | Oui / Non |
| Q9 | Que faire en cas **d’erreur** (Mistral indisponible, timeout) ? | Message explicite / Masquer le bloc / Fallback texte statique |

## 4.3 Technique et données

| # | Question | Options possibles |
|---|----------|-------------------|
| Q10 | Qui appelle Mistral ? **Linky directement** (route API Linky → Mistral) ou **DIVA en tant que service** (Linky → DIVA → Vault + Mistral) ? | Linky → Mistral / Linky → DIVA → Mistral |
| Q11 | Le **contexte** envoyé à Mistral : format JSON brut des agrégats, ou texte structuré préformaté ? | JSON / Texte structuré / Les deux |
| Q12 | Faut-il **cache** la synthèse (même tenant/période/company) pour éviter des appels Mistral répétés ? | Oui / Non / Avec TTL (ex. 5 min) |
| Q13 | **Timeout** Mistral : 30 s, 60 s ? Comportement si dépassement ? | À définir |
| Q14 | Les **agrégats** sont-ils récupérés par Linky (déjà en mémoire) puis transmis à DIVA, ou DIVA les récupère elle-même depuis Vault ? | Linky transmet / DIVA récupère |
| Q15 | **Logs** : faut-il tracer les prompts envoyés à Mistral ? (RGPD, non-log des données sensibles) | Non / Oui (anonymisé) / Oui (audit strict) |

## 4.4 Qualité et évolution

| # | Question | Options possibles |
|---|----------|-------------------|
| Q16 | Comment **valider** la qualité des synthèses (hallucinations, erreurs de lecture des chiffres) ? | Revue manuelle / Tests de non-régression sur prompts / Les deux |
| Q17 | Faut-il prévoir des **prompts modulaires** (synthèse, points d’attention, vérifications) ou un seul prompt qui génère les 3 sections ? | Un prompt / Trois prompts |
| Q18 | **Personnalisation** : la synthèse doit-elle s’adapter au rôle (ex. comptable vs dirigeant) ? | Non en v1 / Oui (paramètre) |

## 4.5 Sécurité et conformité

| # | Question | Options possibles |
|---|----------|-------------------|
| Q19 | Les agrégats transmis à Mistral contiennent-ils des **données nominatives** ou uniquement des totaux ? | Totaux uniquement / Données détaillées |
| Q20 | Faut-il une **authentification** spécifique pour l’appel DIVA/Mistral (token, API key) ? | Non (réseau interne) / Oui |

---

# 5. Périmètre proposé pour la spec v1

**Inclus** :
- Synthèse DIVA (3 sections : Synthèse, Points d’attention, Vérifications suggérées)
- Génération à l’arrivée sur la page Linky (ou sur demande)
- Contexte : agrégats Vault (même périmètre que les cartes)
- Moteur : Mistral local

**Exclu** (v1) :
- DLP et registre d’intentions
- Qualification d’un avis humain saisi
- Personnalisation par rôle
- Historique des synthèses

---

# 6. Prochaines étapes

- [x] Répondre aux questions prioritaires (§4)
- [x] Valider le périmètre v1
- [x] Rédiger la SPEC DIVA v1.1 (`SPEC_DIVA_API_v1.0.md`)
- [x] Créer l’annexe prompt (`ANNEXE_PROMPT_DIVA_FLASH_v1.0.md`)
- [ ] Implémenter le service DIVA (`units/diva/`)

---

# 7. Références

| Document | Rôle |
|----------|------|
| `SPEC_DIVA_API_v1.0.md` | Spec API (v1.1, ready for implementation) |
| `AVIS_SPEC_DIVA_API_v1.0.md` | Avis et recommandations |
| `DOREVIA_THE_BIG_PICTURE.md` | Rôle de DIVA |
| `VISION_TECHNIQUE_DOREVIA_v1.0.md` | Architecture |
| `RAPPORT_IMPLEMENTATION_MISTRAL_2026-02-17.md` | Mistral opérationnel |
| `SPEC_LINKY_HOME_GRID_ICONS_KPI_CARDS_v0.1.md` | Page d’accueil Linky |

---

**Fin du document.**
