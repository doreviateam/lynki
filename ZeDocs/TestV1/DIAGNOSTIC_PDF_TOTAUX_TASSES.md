# 🔍 Diagnostic : Pourquoi les totaux sont toujours "tassés à gauche" ?

## Question 1 : Quel rapport est réellement utilisé ?

### Vérification dans Odoo

1. **Ouvrir la facture pro forma** dans Odoo
2. **Cliquer sur "Imprimer"** (bouton en haut)
3. **Regarder le menu déroulant** : quel rapport est sélectionné ?
   - ✅ **"Facture Pro Forma Dorevia"** → Notre module est utilisé
   - ❌ **"PRO-FORMA Invoice"** ou autre → Le rapport standard est utilisé

### Si le rapport standard est utilisé

**Solution** : Sélectionner explicitement **"Facture Pro Forma Dorevia"** dans le menu déroulant avant de générer le PDF.

---

## Question 2 : Le module est-il bien installé et à jour ?

### Vérification

1. **Apps** → Rechercher "Dorevia Sale Reports"
2. **Vérifier le statut** :
   - ✅ **Installé** → OK
   - ❌ **Non installé** → Installer le module
   - ⚠️ **À mettre à jour** → Mettre à jour le module

### Mise à jour du module

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose exec -T odoo odoo -c /etc/odoo/odoo.conf -u dorevia_sale_reports --stop-after-init
docker compose restart odoo
```

---

## Question 3 : Le cache Odoo est-il vidé ?

### Vider le cache

1. **Redémarrer Odoo** :
```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose restart odoo
```

2. **Vider le cache du navigateur** :
   - Chrome/Edge : `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
   - Firefox : `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)

---

## Question 4 : Le HTML généré contient-il notre structure ?

### Inspection du HTML (méthode avancée)

1. **Générer le PDF** avec "Facture Pro Forma Dorevia"
2. **Télécharger le PDF**
3. **Ouvrir le PDF dans un éditeur de texte** (ou utiliser `pdftotext`)
4. **Chercher** dans le HTML :
   - ✅ `width: 70%` et `width: 30%` → Notre structure est présente
   - ❌ `col-6` ou `ms-auto` → Le rapport standard est utilisé

### Alternative : Inspection via Odoo

1. **Paramètres → Technique → Rapports**
2. **Rechercher "Facture Pro Forma Dorevia"**
3. **Cliquer sur "Vue QWeb"**
4. **Vérifier** que le template contient notre structure table HTML

---

## Question 5 : Un autre module interfère-t-il ?

### Vérification des modules

1. **Apps** → Filtrer par "sale" ou "report"
2. **Vérifier** s'il y a d'autres modules qui modifient les rapports :
   - `dorevia_report_pdf_layout_fix` (peut être en conflit)
   - `dorevia_sale_proforma_report_fix` (peut être en conflit)
   - Autres modules personnalisés

### Solution : Désinstaller les modules en conflit

Si d'autres modules modifient les rapports, les désinstaller temporairement pour tester.

---

## Solution rapide : Forcer l'utilisation du rapport Dorevia

### Méthode 1 : Sélection manuelle

À chaque génération de PDF, **sélectionner explicitement "Facture Pro Forma Dorevia"** dans le menu déroulant.

### Méthode 2 : Définir comme rapport par défaut (si possible)

1. **Paramètres → Technique → Rapports**
2. **Rechercher "Facture Pro Forma Dorevia"**
3. **Vérifier** s'il y a une option pour le définir comme défaut

---

## Checklist de diagnostic

- [ ] Le rapport "Facture Pro Forma Dorevia" est sélectionné lors de la génération
- [ ] Le module `dorevia_sale_reports` est installé et à jour
- [ ] Odoo a été redémarré après la mise à jour
- [ ] Le cache du navigateur a été vidé
- [ ] Aucun autre module n'interfère avec les rapports
- [ ] Le template QWeb contient notre structure table HTML

---

## Si le problème persiste

1. **Générer un PDF** avec "Facture Pro Forma Dorevia"
2. **Télécharger le PDF**
3. **Inspecter le HTML source** du PDF (si possible)
4. **Partager** :
   - Le nom exact du rapport utilisé
   - Un extrait du HTML source (si disponible)
   - Les modules installés qui touchent aux rapports

---

**Version** : v1.0  
**Date** : 2026-01-06

