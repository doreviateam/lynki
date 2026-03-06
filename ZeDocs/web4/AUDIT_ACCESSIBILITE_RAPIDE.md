# ♿ Audit Accessibilité Rapide — Dorevia-Vault

**Date** : 2026-01-19  
**Portée** : Pages principales

---

## ✅ Éléments accessibles

### Layout (`layout.html.twig`)
- ✅ Navigation : `role="menubar"`, `role="menuitem"`, `aria-label`
- ✅ Back to top : `aria-label`, `role="button"`
- ✅ WhatsApp button : `aria-label`, `role="button"`

### Home (`home/index.html.twig`)
- ✅ Status cards : ARIA labels présents
- ✅ Hero : Structure sémantique
- ⚠️ Boutons CTA : À vérifier `aria-label`

### Contact (`contact/index.html.twig`)
- ⚠️ Formulaire : À vérifier labels, erreurs ARIA

---

## ⚠️ Points à améliorer

### 1. Boutons CTA
**Problème** : Pas d'`aria-label` explicite sur tous les boutons

**Action** : Ajouter `aria-label` descriptifs

### 2. Formulaires
**Problème** : Labels, erreurs, états ARIA à vérifier

**Action** : Audit complet formulaires

### 3. Images
**Problème** : Alt text à vérifier

**Action** : Vérifier toutes les images

---

## 📝 Checklist rapide

- [x] Navigation : ARIA labels ✅
- [x] Back to top : ARIA label ✅
- [x] WhatsApp : ARIA label ✅
- [ ] Boutons CTA : ARIA labels
- [ ] Formulaires : Labels, erreurs
- [ ] Images : Alt text
- [ ] Contraste : WCAG AA
- [ ] Clavier : Navigation complète

---

**Fin de l'audit rapide**
