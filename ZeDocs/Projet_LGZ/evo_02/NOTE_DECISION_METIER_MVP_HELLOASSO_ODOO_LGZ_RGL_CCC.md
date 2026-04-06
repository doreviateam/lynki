# Note de decision metier - MVP HelloAsso / Odoo

## LGZ, RGL, CCC

### Objet

Cette note a pour objet de fixer un cadre simple de decision pour le demarrage du MVP HelloAsso / Odoo sur le perimetre LGZ / RGL / CCC.

Le principe retenu est le suivant :

- HelloAsso reste l'outil public pour les adhesions et la billetterie ;
- Odoo devient l'outil interne de consultation, de suivi et de structuration des donnees utiles ;
- le MVP vise d'abord a supprimer la ressaisie et a fiabiliser la donnee interne.

---

## 1. Perimetre MVP retenu

Le MVP couvre les usages suivants :

- remontee dans Odoo des adhesions HelloAsso validees ;
- creation ou mise a jour des contacts utiles au suivi interne ;
- remontee dans Odoo des campagnes de billetterie, des commandes, des payeurs et des participants ;
- consultation interne de ces informations dans Odoo.

Le MVP ne change pas le canal public :

- les adhesions continuent a etre prises dans HelloAsso ;
- la billetterie continue a etre publiee et vendue dans HelloAsso.

---

## 2. Limites assumees

Les limites suivantes sont assumees pour le demarrage :

- Odoo ne remplace pas HelloAsso ;
- le MVP ne couvre pas a ce stade les remboursements, annulations, dons complementaires ou cas complexes ;
- pour les adhesions, le besoin cible est d'abord une fiche contact enrichie et exploitable ;
- pour la billetterie, le besoin cible est d'abord la consultation et la tracabilite interne ;
- la comptabilite detaillee et l'exploitation avancee des flux restent hors perimetre du demarrage.

---

## 3. Regles de gestion a figer avant demarrage

Avant mise en service, les regles suivantes doivent etre confirmees :

1. Chaque flux HelloAsso doit etre rattache clairement a la bonne structure : LGZ, RGL ou CCC.
2. Chaque structure doit savoir quels formulaires ou campagnes HelloAsso relevent de son perimetre.
3. Une regle simple doit etre fixee en cas de doublon contact, notamment lorsque plusieurs fiches partagent le meme e-mail.
4. Le contact Odoo enrichi est retenu comme reference interne de base pour le MVP.
5. Les cas hors perimetre du MVP doivent etre explicitement acceptes comme tels au demarrage.

---

## 4. Decisions a arbitrer en comite

Les arbitrages suivants doivent etre pris en comite :

1. Les flux HelloAsso sont-ils separes par structure, ou certains usages sont-ils mutualises entre LGZ, RGL et CCC ?
2. Quelle est la regle officielle de rattachement des adhesions et des billetteries a chaque structure ?
3. Quelle est la regle officielle de traitement des doublons contacts ?
4. Confirme-t-on que, pour la phase MVP, la billetterie dans Odoo sert uniquement au suivi interne ?
5. Confirme-t-on que l'historique detaille des adhesions est hors perimetre du demarrage et releve d'une phase ulterieure ?

---

## 5. Synthese

Le MVP propose un demarrage simple, utile et prudent.

Il permet :

- de conserver HelloAsso comme outil public ;
- de disposer dans Odoo d'une base interne plus fiable ;
- d'eviter la double saisie sur les usages prioritaires.

Il suppose en contrepartie de valider quelques regles metier claires avant demarrage, afin d'eviter les ambiguities entre LGZ, RGL et CCC.
