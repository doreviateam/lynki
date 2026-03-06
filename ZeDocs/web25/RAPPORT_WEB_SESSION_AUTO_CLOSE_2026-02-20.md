# Rapport détaillé — web_session_auto_close (OCA)

**Date :** 2026-02-20  
**Module :** `web_session_auto_close` (OCA/web)  
**Version :** 18.0.1.0.1  
**Source :** `sources/oca/web/web_session_auto_close/`

---

## 1. Vue d'ensemble

Le module **web_session_auto_close** déconnecte automatiquement les utilisateurs Odoo après une période d'inactivité configurable. Lorsqu'aucune interaction n'est détectée pendant ce délai, la session est détruite et la page est rechargée (écran de connexion).

---

## 2. Architecture

### 2.1 Dépendances

| Composant | Rôle |
|-----------|------|
| `web` | Module Odoo de base pour le backend web ; requis pour le chargement des assets et le fonctionnement du frontend OWL |

### 2.2 Composants du module

| Fichier | Type | Rôle |
|---------|------|------|
| `session_auto_close.esm.js` | Asset JS (OWL) | Détection d'inactivité, gestion du timer, appel des API |
| `res_config_settings.py` | Modèle Python | Champ de configuration pour le timeout |
| `main.py` (controllers) | Contrôleur HTTP | Route JSON `get_timeout` |
| `res_config_settings.xml` | Vue | Affichage du paramètre dans Réglages |
| `__manifest__.py` | Manifest | Déclaration du module |

---

## 3. Flux de fonctionnement

### 3.1 Séquence globale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Chargement de la page Odoo (backend)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. Exécution de session_auto_close.esm.js (asset web.assets_backend)        │
│  2. RPC /web/session/get_timeout → récupération du timeout (ms)             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. startSessionAutoClose()                                                  │
│     - Si lastActivityTime en localStorage : checkInactivity() immédiat     │
│     - addEventListener : mousemove, keydown → updateActivityTime()          │
│     - updateActivityTime() → écriture timestamp dans localStorage           │
│     - setInterval(checkInactivity, timeout/2) → vérification périodique       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                      ┌─────────────┴─────────────┐
                      │  Utilisateur actif        │  Inactivité >= timeout
                      │  (souris, clavier)       │
                      ▼                          ▼
              updateActivityTime()          closeSession()
              (lastActivityTime = now)      - RPC /web/session/destroy
                                          - removeItem(lastActivityTime)
                                          - location.reload()
```

### 3.2 Stockage de l'activité (localStorage)

Le module utilise `localStorage` du navigateur :

| Clé | Type | Description |
|-----|------|-------------|
| `lastActivityTime` | `number` (timestamp ms) | Dernière interaction enregistrée ; utilisée pour calculer la durée d'inactivité |

- **Lecture** : `localStorage.getItem("lastActivityTime")` — si absent, `Date.now()` est utilisé (démarrage "actif")
- **Écriture** : à chaque `mousemove` ou `keydown`
- **Suppression** : lors de `closeSession()` après destruction de la session

### 3.3 Fréquence de vérification

Le timer `setInterval(checkInactivity, SESSION_TIMEOUT / 2)` exécute le contrôle **toutes les (timeout/2) millisecondes**.

| Timeout configuré | Intervalle de vérification |
|------------------|----------------------------|
| 600 s (10 min) | 300 s (5 min) |
| 900 s (15 min) | 450 s (7,5 min) |
| 1800 s (30 min) | 900 s (15 min) |

---

## 4. Détail des composants

### 4.1 Côté JavaScript (`session_auto_close.esm.js`)

**Fonctions :**

| Fonction | Rôle |
|----------|------|
| `getLastActivityTime()` | Lit `lastActivityTime` dans localStorage ; retourne `Date.now()` si absent |
| `updateActivityTime()` | Écrit `Date.now()` dans localStorage |
| `closeSession()` | Appelle `/web/session/destroy`, supprime `lastActivityTime`, puis `location.reload()` |
| `checkInactivity()` | Compare `now - lastActivityTime` au timeout ; si dépassé → `closeSession()` |
| `startSessionAutoClose()` | Initialise écouteurs (`mousemove`, `keydown`), enregistre l'activité initiale, lance `setInterval` |

**Événements écoutés :**

- `mousemove` : mouvements de souris
- `keydown` : touches du clavier

**Valeurs par défaut :**

- Timeout JS par défaut : `600000` ms (10 min) avant réception du paramètre serveur

### 4.2 Côté serveur (Python)

**`res_config_settings.py`** — champ de configuration :

```python
session_auto_close_timeout = fields.Integer(
    string="Session Auto-Close Timeout (seconds)",
    config_parameter="web_session_auto_close.timeout",
    default=600,
)
```

- Stockage : `ir.config_parameter` sous la clé `web_session_auto_close.timeout`
- Valeur par défaut : 600 secondes (10 minutes)

**`controllers/main.py`** — route JSON :

```python
@http.route("/web/session/get_timeout", type="json", auth="user")
def get_session_timeout(self):
    timeout_sec = request.env["ir.config_parameter"].sudo().get_param(
        "web_session_auto_close.timeout", 600
    )
    return int(timeout_sec) * 1000  # Conversion secondes → millisecondes
```

- Authentification requise (`auth="user"`)
- Retourne le timeout en millisecondes pour le JS

### 4.3 Destruction de session

La route `/web/session/destroy` utilisée dans `closeSession()` **n'est pas fournie par ce module** : elle vient du module standard Odoo `web` (core). Elle invalide la session côté serveur puis le rechargement force une nouvelle connexion.

---

## 5. Configuration

### 5.1 Emplacement

**Paramètres > Général** (Settings > General), dans le bloc « Users », sous le paramètre « Invite users ».

### 5.2 Champ

| Champ | Libellé | Unité | Valeur par défaut |
|------|---------|-------|-------------------|
| `session_auto_close_timeout` | Session Auto-Close Timeout (seconds) | secondes | 600 |

### 5.3 Modification par base de données

```sql
-- Lecture
SELECT value FROM ir_config_parameter 
WHERE key = 'web_session_auto_close.timeout';

-- Écriture (exemple : 15 minutes)
INSERT INTO ir_config_parameter (key, value) 
VALUES ('web_session_auto_close.timeout', '900')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## 6. Points d'attention

### 6.1 Portée de localStorage

- `lastActivityTime` est stocké par **origine** (protocole + domaine + port).
- Si l’utilisateur ouvre plusieurs onglets sur le même Odoo, ils partagent le même localStorage ; l’activité dans un onglet met à jour le timer pour tous.

### 6.2 Onglets multiples

- Les onglets partagent le même `lastActivityTime`.
- Un mouvement de souris dans n’importe quel onglet réinitialise le compteur pour tous.
- Si le timeout est dépassé, l’appel à `closeSession()` et `location.reload()` ne concerne que l’onglet où le script s’exécute ; les autres onglets peuvent rester ouverts jusqu’à leur prochain chargement.

### 6.3 Événements non pris en compte

- Clics (`click`) : couverts indirectement par `mousemove` avant le clic.
- Scroll : non pris en compte ; si l’utilisateur scroll sans bouger la souris ni taper, l’activité n’est pas réenregistrée.

### 6.4 Comportement au premier chargement

- Si `lastActivityTime` existe déjà (navigation précédente) : `checkInactivity()` est exécutée immédiatement.
- Si l’inactivité précédente dépasse le timeout, l’utilisateur peut être déconnecté dès l’ouverture de la page.

### 6.5 Sécurité

- La vérification est principalement côté client (JavaScript).
- Un utilisateur peut désactiver JavaScript ou modifier le script pour éviter la déconnexion.
- La destruction de session reste bien effectuée côté serveur via `/web/session/destroy`.

---

## 7. Synthèse technique

| Aspect | Détail |
|--------|--------|
| **Nom technique** | `web_session_auto_close` |
| **Dépôt** | OCA/web |
| **Licence** | AGPL-3.0 |
| **Timeout par défaut** | 600 s (10 min) |
| **Stockage activité** | `localStorage["lastActivityTime"]` |
| **Vérification** | Toutes les (timeout/2) ms |
| **Événements** | `mousemove`, `keydown` |
| **Paramètre serveur** | `ir.config_parameter` → `web_session_auto_close.timeout` |
| **Route custom** | `GET /web/session/get_timeout` (JSON, auth user) |
| **Route Odoo core** | `POST /web/session/destroy` |

---

## 8. Schéma des fichiers

```
web_session_auto_close/
├── __manifest__.py           # Déclaration module, assets
├── __init__.py
├── models/
│   ├── __init__.py
│   └── res_config_settings.py   # Champ session_auto_close_timeout
├── controllers/
│   ├── __init__.py
│   └── main.py                  # Route /web/session/get_timeout
├── views/
│   └── res_config_settings.xml  # Champ dans Settings > General
├── static/
│   ├── description/index.html  # Description module
│   └── src/js/
│       └── session_auto_close.esm.js  # Logique client
├── readme/
│   ├── DESCRIPTION.md
│   ├── CONFIGURE.md
│   └── CONTRIBUTORS.md
├── i18n/
│   ├── web_session_auto_close.pot
│   └── it.po
├── pyproject.toml
└── README.rst
```

---

*Rapport généré à partir de l’analyse du code source du module dans la plateforme Dorevia.*
