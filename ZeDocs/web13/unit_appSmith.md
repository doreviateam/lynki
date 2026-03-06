Bonjour,

Next move : on démarre **Dorevia-UI** et on choisit **Appsmith CE (self-host)** comme accélérateur d’interface.

### Objectif (court terme)

Disposer d’une UI mobile-first très simple (le “compteur”) pour visualiser :

* factures **ventes** validées + **vaultées**
* factures **achats** validées + **vaultées**
* (étape suivante) indicateurs agrégés type **Trésorerie brute** / **Total ventes** / **Total achats**

On ne cherche pas un ERP bis : juste un tableau de bord lisible, basé sur des événements certifiés.

### Demande

Merci d’ajouter Appsmith comme **unit** dans `dorevia-plateforme` :

* Nouveau dossier : `units/appsmith/`
* Déploiement Docker standard (compose) + **volume persistant**
* Exposition via notre reverse-proxy (Caddy) avec une URL de type :

  * `ui.<env>.<tenant>.<domaine>` (ou variante cohérente avec vos conventions)
* Variables d’environnement de chiffrement Appsmith (encryption password + salt)
* Documentation minimale : run / upgrade / backup volume

### Sécurité / architecture (non négociable)

* Appsmith consomme **uniquement** une **API Dorevia-UI read-only** (tenant-scoped)
* Pas d’accès direct Appsmith → DB Vault

### Definition of Done

* `unit up` démarre Appsmith
* UI accessible via le domaine
* redémarrage serveur OK (persistance OK)
* une page “Hello Dorevia-UI” existe (base de travail)

Merci,
David
