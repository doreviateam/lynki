# Avis d'expert — BIG_PICTURE_TRESO (Card 1/9 Trésorerie)

**Date :** 2026-03-03  
**Document analysé :** `BIG_PICTURE_TRESO.md`  
**Contexte :** Proposition UX carte Trésorerie (Position vs Flux) pour Dorevia Linky

---

## 1. Synthèse

Le document pose une distinction **flux / position** pertinente et propose une carte Trésorerie comme ancre du cockpit. L’analyse est solide et la recommandation (option 2, carte pleine largeur) est cohérente. La faisabilité technique dépend toutefois des sources de données pour les métriques avancées (autonomie, disponible sécurisé).

---

## 2. Points forts

### 2.1 Distinction flux / position

La distinction entre **Cash (flux)** et **Trésorerie (position)** est correcte et alignée avec les besoins métier. Pour un dirigeant de PME, la question centrale est bien : « Combien j’ai réellement ? », avant « Combien j’ai encaissé/dépensé sur la période ? ».

### 2.2 Alignement avec l’existant

Le document reflète bien l’implémentation actuelle :

- **Paiements** (TreasuryCard) : taux de rapprochement, solde ERP, exposition non validée — indicateur de **processus**, pas de position.
- **Cash** (FluxCashCard) : net espèces sur la période — **flux** opérationnel.

### 2.3 Proposition UX

L’**option 2** (carte pleine largeur au-dessus des autres) est pertinente : la position doit être l’ancre du cockpit, avant les flux et les détails.

### 2.4 Structure du document

Le document est clair, structuré et orienté décision produit.

---

## 3. Points d’attention

### 3.1 Sources de données

Les métriques proposées supposent des données qui ne sont pas toutes disponibles aujourd’hui :

| Métrique proposée      | Source probable                    | Disponibilité actuelle                                      |
|------------------------|------------------------------------|------------------------------------------------------------|
| Solde confirmé banque  | Relevé bancaire / API banque       | Vault : `validated_balance` ; Odoo : `erp_balance`         |
| Disponible sécurisé    | Position − marge de sécurité       | À définir (règle métier)                                   |
| Autonomie : 2,2 mois   | Position ÷ charges fixes mensuelles| Charges fixes non agrégées dans Vault/Linky                 |

Le Vault expose déjà `position.validated_balance` et `position.erp_balance`. Pour « solde confirmé banque », il faudra préciser si l’on parle du solde comptable Odoo ou du solde réel banque (nécessitant une API bancaire ou le dernier relevé rapproché).

### 3.2 Autonomie (runway)

Le calcul « Autonomie : 2,2 mois » implique :

- un montant de charges fixes mensuelles (ou burn rate),
- une logique de projection.

Ces données ne sont pas aujourd’hui dans le Vault. Elles pourraient venir d’Odoo (comptabilité, échéanciers) ou d’une configuration dédiée. C’est un chantier fonctionnel et technique à part entière.

### 3.3 Cohérence avec la stack Dorevia

Dorevia se positionne sur des **données scellées**. La carte Trésorerie proposée doit rester alignée avec ce principe :

- **Solde confirmé** : cohérent si basé sur des paiements vaultés et rapprochés.
- **Disponible sécurisé** : dépend de la règle (ex. position − engagements connus).
- **Autonomie** : dépend de données non scellées (charges, prévisions) — à traiter comme une métrique « indicative » ou « non certifiée ».

---

## 4. Recommandations

### Phase 1 — MVP rapide

1. **Carte Trésorerie pleine largeur** au-dessus des autres.
2. **Contenu initial** :
   - **Solde ERP** : `erp_balance` (déjà disponible).
   - **Position validée** : `validated_balance` (déjà disponible).
   - **Taux de rapprochement** : déjà disponible.
3. **Libellés** : distinguer clairement « Solde comptable » vs « Position validée (Vault) ».

### Phase 2 — Enrichissement

4. **Disponible sécurisé** : définir une règle (ex. position − X mois de charges, ou marge fixe) et la documenter.
5. **Autonomie** : spécifier la source des charges fixes et le mode de calcul, puis intégrer dans un second temps.

### Phase 3 — Données bancaires réelles (si applicable)

6. Intégration API bancaire ou agrégation des derniers relevés rapprochés pour un « solde confirmé banque » plus proche du réel.

---

## 5. Conclusion

Le document est pertinent et bien aligné avec les besoins d’un cockpit trésorerie. La recommandation (option 2, carte Trésorerie en tête) est cohérente.

Pour la mise en œuvre, il faut :

1. **Préciser les sources** pour chaque métrique (Vault, Odoo, API banque, config).
2. **Définir les règles** pour « disponible sécurisé » et « autonomie ».
3. **Commencer par un MVP** basé sur `erp_balance` et `validated_balance`, puis enrichir progressivement.

---

**Fin du document — Avis d'expert**
