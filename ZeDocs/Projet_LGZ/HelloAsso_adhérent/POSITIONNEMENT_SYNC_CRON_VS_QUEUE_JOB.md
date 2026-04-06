# Positionnement — automatisation synchro HelloAsso (`ir.cron` vs `queue_job`)

<!-- id: q8s1bf -->

| | |
|---|---|
| **Date** | Avril 2026 |
| **Statut** | Décision de principe pour le **palier suivant** du MVP (post-bouton manuel) |

---

## Positionnement retenu

Nous **n’introduisons pas `queue_job` dans ce MVP**.

Le choix retenu est de **commencer par une automatisation simple via `ir.cron`**, afin d’automatiser le déclenchement de la synchro HelloAsso sans ajouter dès maintenant une couche technique plus lourde.

### Pourquoi

Le besoin immédiat est d’**automatiser l’exécution** de la synchro, pas encore de mettre en place une architecture asynchrone complète.  
À ce stade, le flux est maîtrisé, les cas principaux sont validés, et la priorité reste :

- simplicité d’exploitation
- lisibilité du comportement
- limitation du risque technique
- continuité avec le MVP actuel

### Décision

Le prochain palier est donc :

- **action planifiée Odoo (`ir.cron`)**
- fréquence modérée à définir
- journalisation claire
- conservation des garde-fous métier déjà en place

### Ce que nous ne faisons pas maintenant

Nous **ne basculons pas tout de suite sur `queue_job`**, car ce serait introduire trop tôt une complexité supplémentaire par rapport au besoin réel du MVP.

### Ce qui pourra venir ensuite

Le passage à `queue_job` sera envisagé en **palier 2**, uniquement si l’expérience réelle le justifie :

- volumétrie plus élevée
- temps d’exécution trop long
- besoin de retries plus avancés
- nécessité de ne plus bloquer l’interface
- besoin de découper le traitement en tâches asynchrones

## Conclusion

La ligne retenue est simple :

**automatisation oui, mais d’abord via `ir.cron` ; `queue_job` viendra seulement si le terrain le justifie.**

---

## Version courte (échange dev)

On ne part pas sur `queue_job` dans ce MVP.

La décision est de commencer par une automatisation simple via `ir.cron`.  
Le besoin actuel est d’automatiser le **déclenchement** de la synchro HelloAsso, pas encore d’introduire une architecture asynchrone plus lourde.

Donc :

- **maintenant** : `ir.cron`
- **plus tard, si nécessaire** : `queue_job`

`queue_job` reste un **palier 2**, à activer seulement si la volumétrie, le temps de traitement ou le besoin de retries le justifient.

---

## Références code

- Synchro actuelle (manuelle) : `dorevia_helloasso_members` — `run_membership_payments_sync`, bouton Paramètres.
- Instance lab : `queue_job` peut être chargé au niveau serveur pour d’**autres** modules ; il n’est **pas** utilisé par le MVP HelloAsso à ce jour.
