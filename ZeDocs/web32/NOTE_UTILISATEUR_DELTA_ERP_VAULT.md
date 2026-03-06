# Note utilisateur — Carte Trésorerie : Delta ERP vs Vault

**Public :** Utilisateurs finaux du cockpit Linky  
**Contexte :** Carte Trésorerie validée (spec v4.1)

---

## Pourquoi un écart peut apparaître entre Solde ERP et Trésorerie validée ?

La carte Trésorerie affiche deux types de données :

| Source | Contenu |
|--------|---------|
| **Trésorerie validée** (Vault) | Montants des lignes de relevés bancaires **déjà rapprochées** |
| **Solde ERP** (Odoo) | Solde comptable des comptes bancaires (ledger) |

Ces deux indicateurs ne couvrent **pas exactement le même périmètre**. Un écart est donc **possible et normal** dans les situations suivantes.

---

## Situations courantes d’écart

| Situation | Explication |
|-----------|-------------|
| **Écritures d’ouverture / à cheval** | Le ledger ERP inclut des écritures qui ne passent pas par les relevés bancaires |
| **Opérations diverses (OD)** | Régularisations manuelles, rejets, etc. présents dans le ledger mais pas dans les lignes de relevé |
| **Relevés non encore importés** | Des mouvements existent dans l’ERP sans correspondance dans les relevés |
| **Décalage temporel** | Un rapprochement vient d’être effectué ; la mise à jour dans le cockpit peut prendre quelques secondes |

---

## Que signifient les badges ?

| Badge | Signification |
|-------|---------------|
| **Écart important** | L’écart entre Solde ERP et Trésorerie validée dépasse un seuil (500 € ou 5 % du solde) |
| **Écart structurel** | La trésorerie validée dépasse le solde ERP (ex. écritures non reflétées dans le ledger) |
| **Signes incohérents** | Solde ERP et Trésorerie validée sont de signes opposés (ex. compte à découvert vs montant validé positif) |

Ces badges permettent d’identifier des situations à contrôler, sans pour autant indiquer une erreur systématique.

---

## Recommandation

En cas d’écart inhabituel ou de badge affiché :

1. Vérifier le rapprochement bancaire dans Odoo
2. Contrôler les écritures d’ouverture et OD sur les comptes bancaires
3. S’assurer que les derniers relevés ont bien été importés et rapprochés

Si le doute persiste, contacter le support fonctionnel.
