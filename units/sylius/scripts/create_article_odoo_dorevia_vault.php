<?php

/**
 * Script pour créer l'article de blog : Connecter Odoo à Dorevia Vault
 * Usage: depuis units/sylius : php scripts/create_article_odoo_dorevia_vault.php
 * Ou : php scripts/create_article_odoo_dorevia_vault.php (depuis le répertoire du projet Sylius)
 */

use Symfony\Component\Dotenv\Dotenv;

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = new Dotenv();
$dotenv->load(__DIR__ . '/../.env');

$kernel = new \App\Kernel($_ENV['APP_ENV'] ?? 'dev', (bool) ($_ENV['APP_DEBUG'] ?? false));
$kernel->boot();

$container = $kernel->getContainer();
$entityManager = $container->get('doctrine.orm.entity_manager');

function createSlug($text) {
    $text = strtolower($text);
    $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
    $text = preg_replace('/[^a-z0-9-]+/', '-', $text);
    $text = trim($text, '-');
    return $text;
}

$title = "Comment connecter Odoo à Dorevia Vault pour sceller et prouver vos factures";
$slug = 'connecter-odoo-dorevia-vault-sceller-factures';
$category = 'ERP & Odoo CE';
$author = 'Dorevia Team';

$content = <<<'MARKDOWN'
Dans la majorité des ERP, une facture validée reste une simple donnée : elle peut être modifiée, supprimée ou remplacée sans laisser de trace exploitable juridiquement.

En cas d'audit, de contrôle fiscal ou de litige, cela complique la preuve d'intégrité des chiffres.

**Dorevia Vault** change cette réalité en transformant chaque facture validée dans Odoo en une **preuve financière scellée, horodatée et vérifiable** — automatiquement, sans manipulation humaine.

👉 Dans ce guide, vous apprendrez à :

- connecter votre instance Odoo à Dorevia Vault
- sécuriser vos factures sans changer d'ERP
- visualiser des preuves directement dans Odoo

---

## 🎯 Pourquoi la preuve financière est devenue stratégique

Sceller une facture permet de :

- garantir qu'elle n'a pas été modifiée après validation
- disposer d'une preuve opposable en cas de contrôle
- fiabiliser trésorerie et états financiers
- simplifier conformité et audits

> Vos chiffres deviennent fiables par conception.

---

## 🧩 Vue d'ensemble du fonctionnement

```
Odoo → DVIG → Dorevia Vault → Preuve financière
```

### DVIG — passerelle sécurisée

Reçoit chaque validation de facture depuis Odoo.

### Dorevia Vault — coffre-fort de preuve

Scelle, horodate et stocke les preuves de manière immuable.

Chaque entreprise (tenant) dispose :

- d'une identité unique
- d'un accès sécurisé dédié

👉 Isolation + traçabilité garanties.

---

## 📦 Prérequis avant de commencer

### Obligatoire

- Odoo CE 18 ou supérieur
- Module Odoo `account`
- Module `dorevia_vault_connector`

### Recommandé

- `queue_job`
- `dorevia_posted_lock`

---

## 📥 Installation du module

### Via l'interface Odoo

1. Allez dans **Applications** > **Mettre à jour la liste des applications**
2. Recherchez « Dorevia Vault Connector »
3. Cliquez sur **Installer**

### Via ligne de commande

```bash
odoo-bin -c odoo.conf -u dorevia_vault_connector -d votre_base
```

---

## 🏷 Étape 1 — Identifier votre instance Odoo

### Pourquoi cette étape ?

Pour que Dorevia Vault sache **quelle entreprise envoie les données**.

### Format

```
odoo.<environnement>.<tenant>
```

### Exemple

```
odoo.lab.lglz
```

- `odoo` = ERP source
- `lab` = environnement
- `lglz` = entreprise (tenant)

### ✅ Résultat attendu

Votre instance est reconnue comme source officielle.

---

## 🔑 Étape 2 — Générer un token sécurisé dédié

### Pourquoi ?

Chaque entreprise possède sa propre clé chiffrée pour éviter toute confusion ou fraude de flux.

```bash
python -m dvig.cli.token_gen --tenant lglz --univers odoo --output token
python -m dvig.cli.token_gen --tenant lglz --univers odoo --output yaml
```

Ajoutez le bloc YAML au fichier DVIG et rechargez le service.

### ✅ Résultat attendu

Un accès sécurisé unique pour votre tenant.

---

## ⚙ Étape 3 — Configurer Odoo

Dans **Paramètres → Technique → Paramètres système** :

### Connexion DVIG

- `dorevia.dvig.url`
- `dorevia.dvig.source`
- `dorevia.dvig.token`

### Connexion Vault

- `dorevia.vault.url`
- `dorevia.vault.token`

### Activation par modèle

Activez la vaultérisation pour les modèles souhaités :

- **Factures clients** (`account.move` type `out_invoice`)
- **Factures fournisseurs** (`account.move` type `in_invoice`)
- **Avoirs** (`account.move` type `out_refund` / `in_refund`)
- **Tickets POS** (`pos.order`)

### ✅ Résultat attendu

Odoo est connecté à l'infrastructure de preuve.

---

## 🧪 Étape 4 — Générer votre première preuve financière

1. Créez une facture client
2. Validez-la

Après quelques secondes :

- **Protection en cours**
- puis **Protégée**
- une preuve horodatée apparaît

🎉 Votre facture est désormais inaltérable.

---

## ✅ Vérification

### Dans Odoo

Chaque facture vaultée affiche :

- Badge **« Protégée »** (ou « Vaulté ») dans la vue formulaire
- Lien vers la preuve dans le chatter
- Export de la preuve en PDF

### Via l'API Vault

Vous pouvez récupérer une preuve par son **ID Odoo** (visible dans l’URL de la facture, ex. `.../customer-invoices/1946` → ID `1946`) :

```bash
curl -X GET "https://vault.lab.core.doreviateam.com/api/v1/proof/account_move/1946" \
  -H "Authorization: Bearer VOTRE_TOKEN_VAULT"
```

Remplacez l’URL du Vault, l’ID de la facture et le token (celui configuré dans Odoo : `dorevia.vault.token`). La réponse JSON contient notamment `hash`, `timestamp`, `jws` et `status`. Pour plusieurs preuves en une requête : `POST /api/v1/proof/bulk` (voir documentation Vault).

---

## 🚑 Dépannage rapide

- **Rien ne se passe** — paramètres manquants : vérifier la configuration (DVIG + Vault)
- **403 TENANT_MISMATCH** — mauvais token : générer un token dédié (Étape 2)
- **401 Unauthorized** — token invalide : régénérer
- **Erreur serveur** — DVIG : consulter les logs

### La facture n'est pas vaultée

1. Vérifiez que le module est bien installé et activé
2. Vérifiez les paramètres système (`dorevia.dvig.*`, `dorevia.vault.*`)
3. Consultez les logs Odoo : `tail -f /var/log/odoo/odoo.log | grep vault`
4. Vérifiez la connectivité réseau vers DVIG et Vault

### Erreur de synchronisation

1. Vérifiez que le token DVIG est valide et correspond au tenant
2. Vérifiez que le token Vault correspond à votre compte
3. Contactez le support Dorevia-Vault si le problème persiste

---

## 📈 Ce que ce branchement change concrètement

### Avant

- données modifiables
- audits complexes
- confiance fragile

### Après

- preuves financières automatiques
- traçabilité totale
- conformité facilitée
- chiffres fiables

---

## 🧠 En résumé

> Chaque facture validée dans Odoo devient une preuve financière scellée, vérifiable et opposable.

Dorevia Vault transforme votre ERP en **infrastructure de confiance financière**.

---

## 👉 Aller plus loin

- 📥 Télécharger la checklist complète
- 🎥 Voir une démonstration réelle en 2 minutes
- 📞 Contacter l'équipe Dorevia Vault

---

### 🎯 Pourquoi cette approche est différente

- Aucun changement d'ERP
- Aucune manipulation humaine
- Sécurité by design
- Scalabilité multi-entreprises
MARKDOWN;

$excerpt = "Dans la majorité des ERP, une facture validée reste une simple donnée modifiable. Dorevia Vault transforme chaque facture validée en preuve financière scellée, horodatée et vérifiable. Ce guide vous permet de connecter Odoo, sceller et prouver vos factures sans changer d'ERP.";

$existing = $entityManager->getRepository(\App\Entity\Article::class)->findOneBy(['slug' => $slug]);
if ($existing) {
    $existing->setTitle($title);
    $existing->setContent($content);
    $existing->setExcerpt($excerpt);
    $existing->setMetaDescription($excerpt);
    $entityManager->flush();
    echo "✅ Article mis à jour avec succès !\n";
    echo "   ID: {$existing->getId()}\n";
    echo "   Titre: {$existing->getTitle()}\n";
    echo "   Slug: {$existing->getSlug()}\n";
    echo "   URL: https://sylius.lab.core.doreviateam.com/blog/{$existing->getSlug()}\n";
} else {
    $article = new \App\Entity\Article();
    $article->setTitle($title);
    $article->setSlug($slug);
    $article->setContent($content);
    $article->setExcerpt($excerpt);
    $article->setAuthor($author);
    $article->setCategory($category);
    $article->setStatus('published');
    $article->setPublishedAt(new \DateTimeImmutable());
    $article->setMetaDescription($excerpt);
    $article->setFeatured(false);
    $article->setTags(['odoo', 'dorevia-vault', 'scellement', 'factures']);
    $entityManager->persist($article);
    $entityManager->flush();
    echo "✅ Article créé avec succès !\n";
    echo "   ID: {$article->getId()}\n";
    echo "   Titre: {$article->getTitle()}\n";
    echo "   Slug: {$article->getSlug()}\n";
    echo "   URL: https://sylius.lab.core.doreviateam.com/blog/{$article->getSlug()}\n";
}
