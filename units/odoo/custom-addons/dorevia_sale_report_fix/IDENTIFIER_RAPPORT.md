# 🔍 Identifier le rapport et la vue QWeb effective

## Objectif

Obtenir **3 informations exactes** pour diagnostiquer le problème d'`external_layout` :

1. ✅ **Nom technique exact du rapport**
2. ✅ **Nom technique de la vue QWeb**
3. ✅ **Présence/absence de `external_layout`**

---

## Étape 1 : Identifier le nom technique exact du rapport

### Méthode (Interface Odoo)

1. **Ouvrir un devis/commande** dans Odoo
2. **Cliquer sur "Imprimer"** (bouton en haut)
3. **Noter le nom exact** affiché dans le menu déroulant (ex: "Quotation / Order")

### Récupérer le nom technique

1. **Paramètres → Technique → Rapports**
2. **Rechercher** le nom noté à l'étape précédente
3. **Ouvrir le rapport**
4. **Noter le "Nom technique"** (ex: `sale.report_saleorder`)

👉 **Résultat attendu** : `sale.report_saleorder` (ou autre)

---

## Étape 2 : Identifier le nom technique de la vue QWeb

### Méthode (Interface Odoo)

1. **Dans le rapport** (Paramètres → Technique → Rapports)
2. **Cliquer sur "Vue QWeb"** (ou "Template" selon l'écran)
3. **Noter le "Nom technique"** de la vue (ex: `sale.report_saleorder_document`)

👉 **Résultat attendu** : `sale.report_saleorder_document` (ou autre)

---

## Étape 3 : Vérifier la présence de `external_layout`

### Méthode (Interface Odoo)

1. **Dans la vue QWeb** (étape 2)
2. **Chercher** (`Ctrl+F`) : `external_layout`
3. **Vérifier** si la ligne suivante est présente :
   ```xml
   <t t-call="web.external_layout">
   ```

👉 **Résultat attendu** : 
- ✅ **PRÉSENT** : La ligne `<t t-call="web.external_layout">` existe
- ❌ **ABSENT** : La ligne n'existe pas

---

## Format de réponse

Une fois les 3 informations collectées, fournir :

```
1. Nom technique du rapport : [ex: sale.report_saleorder]
2. Nom technique de la vue QWeb : [ex: sale.report_saleorder_document]
3. external_layout présent/absent : [PRÉSENT / ABSENT]
```

---

## ⚠️ Important

- ❌ **Ne pas faire confiance aux libellés UI** (ex: "Devis en PDF" peut cacher un rapport différent)
- ❌ **Ne pas supposer qu'un rapport "standard" est intact** (un module peut l'avoir modifié)
- ✅ **Toujours vérifier la vue QWeb effective** (celle qui est réellement utilisée)

---

## Solution directe (recommandée)

👉 **Vous pouvez installer directement le module `dorevia_sale_report_fix`** sans attendre de diagnostiquer.

Le module :
- Force la présence de `<t t-call="web.external_layout">` dans la vue QWeb
- Priorité 99 pour s'assurer qu'il s'applique après les autres héritages
- Garantit que le critère de vérité est respecté **dans tous les cas**

**Installation** :
1. Apps → Rechercher "Dorevia Sale Report Fix"
2. Installer
3. Mettre à jour le module
4. Redémarrer Odoo
5. Tester la génération d'un PDF

---

## Si external_layout est ABSENT (diagnostic)

Si vous voulez comprendre **pourquoi** le problème existe avant d'installer le module, suivez les étapes 1-3 ci-dessus pour identifier :
- Quel rapport est utilisé
- Quelle vue QWeb est effective
- Si `external_layout` est présent ou absent

Ces informations sont utiles pour comprendre le problème, mais **le module résout le problème dans tous les cas**.

