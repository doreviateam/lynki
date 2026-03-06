# 🔐 Recommandation de sécurité — Expiration automatique des tokens DVIG

**Document** : Recommandation Sécurité — Tokens DVIG  
**Version** : v1.0  
**Date** : 2026-01-02  
**Statut** : Recommandation (non implémentée à ce stade)  
**Périmètre** : DVIG — Authentification Bearer Token

---

## 1. Constat actuel

Les tokens DVIG sont actuellement :

- émis manuellement via la CLI (`dorevia.sh token issue`)
- valides **sans limite de durée**
- révoqués uniquement par action explicite

### Risque identifié
En cas de compromission (fuite de token, log exposé, machine compromise),  
le token reste exploitable **indéfiniment**, augmentant le risque de fraude ou d'accès non autorisé.

---

## 2. Objectif de sécurité

Mettre en place une **expiration automatique des tokens** afin de :

- réduire l'impact d'une compromission
- renforcer la posture sécurité globale
- améliorer la traçabilité et l'auditabilité
- préparer les futures exigences de conformité

Cette évolution doit rester :
- simple à implémenter
- rétrocompatible
- sans complexifier l'exploitation quotidienne

---

## 3. Proposition fonctionnelle

### 3.1 Principe général
Chaque token DVIG peut être associé à une **date d'expiration**.

> Un token expiré est automatiquement rejeté, même s'il n'a pas été révoqué manuellement.

---

## 4. Modèle de données

### 4.1 Évolution de la table `dvig_tokens`

Ajouter le champ suivant :

```sql
expires_at TIMESTAMP WITH TIME ZONE NULL
```

#### Règles associées
- `expires_at IS NULL`  
  → token legacy, comportement inchangé (valide sans limite)
- `expires_at IS NOT NULL`  
  → token à durée de vie limitée

👉 Cette approche garantit une **rétrocompatibilité totale**.

---

## 5. Validation côté DVIG

### 5.1 Logique de contrôle (bearer.py)

Lors de la validation d'un token :

```python
if token.expires_at is not None:
    if token.expires_at <= now():
        raise TokenExpiredError
```

### 5.2 Comportement attendu
- Token valide et non expiré → accès autorisé
- Token expiré → **401 Unauthorized**
- Message d'erreur générique côté client
- Détail consigné uniquement dans les logs internes

---

## 6. Journalisation & audit

Chaque rejet pour expiration doit produire un événement de log structuré :

```json
{
  "event": "token_expired",
  "tenant": "<tenant>",
  "univers": "<univers>",
  "token_id": "<id>",
  "expires_at": "<timestamp>"
}
```

### Objectifs
- support et diagnostic
- audit sécurité
- détection d'abus ou d'anomalies

---

## 7. Politique de durée recommandée

| Type de token | Durée conseillée |
|--------------|------------------|
| Token univers applicatif (Odoo, etc.) | 12 mois |
| Token de test / LAB | 1 à 3 mois |
| Token temporaire | quelques jours |

⚠️ Les durées doivent rester **configurables**, pas codées en dur.

---

## 8. Extension CLI (proposition)

### 8.1 À la création du token

```bash
dorevia.sh token issue odoo prod pierez --expires-in 365d
```

ou

```bash
dorevia.sh token issue odoo prod pierez --expires-at 2027-01-01
```

### 8.2 Comportement par défaut
- si aucun paramètre n'est fourni :
  - soit application d'une valeur par défaut (ex. 12 mois)
  - soit `expires_at = NULL` pour compatibilité Phase 3

Le choix dépendra de la stratégie produit retenue.

---

## 9. Rotation automatique (hors périmètre immédiat)

La rotation automatique des tokens n'est **pas requise à ce stade**.

Idées pour une phase ultérieure :
- notification avant expiration
- double-token temporaire pour transition
- rotation automatique planifiée

Ces évolutions sont volontairement reportées afin de ne pas complexifier la Phase 3.

---

## 10. Positionnement roadmap

### Statut
- ❌ Non implémenté
- 🟡 Recommandé
- 🟢 Implémentable sans refonte

### Placement recommandé
👉 **Phase 4 — Sécurité & Exploitation avancée**

---

## 11. Texte normatif prêt à intégrer dans les specs

> **Sécurité — Expiration des tokens**  
>  
> Les tokens DVIG peuvent être associés à une date d'expiration (`expires_at`).  
> Lors de chaque requête authentifiée, DVIG vérifie que le token est valide et non expiré.  
>  
> Un token expiré est automatiquement rejeté, indépendamment de son état de révocation.

---

## 12. Conclusion

Cette recommandation apporte une **amélioration significative de la sécurité** sans remettre en cause
l'architecture existante.

Elle constitue :
- un gain immédiat en cas de fuite
- une préparation aux audits futurs
- une brique naturelle vers une gestion de tokens plus avancée

---

**Fin du document**

