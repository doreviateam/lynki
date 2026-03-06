<?php

/**
 * Script pour créer un article de blog à partir d'un contenu
 * Usage: php scripts/create_article_from_content.php
 */

use Symfony\Component\Dotenv\Dotenv;

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = new Dotenv();
$dotenv->load(__DIR__ . '/../.env');

$kernel = new \App\Kernel($_ENV['APP_ENV'] ?? 'dev', (bool) ($_ENV['APP_DEBUG'] ?? false));
$kernel->boot();

$container = $kernel->getContainer();
$entityManager = $container->get('doctrine.orm.entity_manager');

// Fonction pour créer un slug
function createSlug($text) {
    $text = strtolower($text);
    $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
    $text = preg_replace('/[^a-z0-9-]+/', '-', $text);
    $text = trim($text, '-');
    return $text;
}

// Données de l'article
$title = "La preuve financière : un nouveau marché ou une évolution naturelle de la gestion d'entreprise ?";
$slug = createSlug($title);
$category = 'Preuve & audit';
$author = 'Dorevia Team';

$content = <<<'MARKDOWN'
# La preuve financière : un nouveau marché ou une évolution naturelle de la gestion d'entreprise ?

Quand on parle de fiabilité des chiffres, beaucoup pensent immédiatement à l'audit, à la conformité ou aux grandes entreprises.

Pourtant, la question se pose aujourd'hui pour **toutes les structures** :
indépendants, PME, filiales, jusqu'aux ETI.

Car ce qui a changé, ce n'est pas la taille des entreprises.
C'est l'exigence croissante de **traçabilité, de transparence et de fiabilité des données financières**.

---

## 📊 Les chiffres existent. La preuve, pas toujours.

Les ERP et logiciels de gestion produisent des factures, des paiements, des écritures comptables.
Ils font très bien ce travail.

Mais dans la majorité des systèmes :

* une donnée validée reste techniquement modifiable
* une correction peut intervenir après coup
* l'historique existe, sans mécanisme de preuve automatique

Cela ne signifie pas qu'il y a fraude.
Cela signifie simplement que **la fiabilité repose encore largement sur l'organisation humaine**.

---

## 🧾 Pourquoi la question devient centrale aujourd'hui

Les administrations fiscales, les partenaires financiers et les auditeurs attendent de plus en plus :

* des données traçables
* des historiques clairs
* une intégrité démontrable

Ce mouvement concerne :

* l'indépendant structuré
* la PME en croissance
* comme l'ETI multi-sites

La fiabilité financière devient un standard de bonne gestion.

---

## 📍 Une réalité très concrète pour les entreprises locales

Prenons un cas simple, courant en Guadeloupe comme ailleurs :

Une entreprise équipée d'un ERP pour :

* facturer ses clients
* encaisser ses paiements
* piloter sa trésorerie

Tout fonctionne bien au quotidien.

Mais en cas de contrôle ou d'audit, il faut :

* reconstituer l'historique
* expliquer les corrections
* justifier l'intégrité des chiffres

Cela demande du temps, de l'énergie, et crée souvent de l'incertitude.

Ce que recherchent les responsables financiers n'est pas la complexité technique.
Ils recherchent avant tout **la sérénité**.

---

## ✅ L'émergence de la preuve financière

La preuve financière ne remplace pas les ERP.
Elle les complète.

Son principe est simple :

> Transformer chaque événement validé en donnée vérifiable dans le temps.

Concrètement :

* une facture validée devient une preuve scellée
* un paiement enregistré devient une preuve traçable
* une écriture comptable devient une preuve immuable

Sans modifier les usages quotidiens.

---

## 📈 Un marché déjà présent — sans toujours porter ce nom

Aujourd'hui, ce besoin est traité à travers :

* l'audit
* les contrôles internes
* la conformité réglementaire
* les outils de traçabilité

Dans les grandes organisations, ces mécanismes sont souvent lourds et coûteux.

Ce qui change aujourd'hui, c'est leur **automatisation directement à la source des données financières**.

La preuve financière devient ainsi accessible à toutes les tailles d'entreprise.

---

## 🎯 Ce que cela apporte concrètement

Pour une direction financière :

* audits plus simples et plus rapides
* diminution du stress en cas de contrôle
* meilleure gouvernance
* confiance renforcée dans les chiffres
* conformité intégrée au quotidien

Sans surcharge opérationnelle.

---

## 🧠 Alors, est-ce un nouveau marché ?

On peut le voir comme :

✔ une évolution naturelle de l'audit et de la conformité
✔ une modernisation de la gestion financière
✔ une réponse aux exigences croissantes de transparence

La preuve financière n'est pas une mode.
C'est la prochaine étape logique de la fiabilité des chiffres.

---

## 📌 En conclusion

Les entreprises ont toujours produit des données financières.
Elles entrent désormais dans une ère où ces données doivent devenir **des preuves**.

Pas pour faire peur.
Pas pour complexifier.

Mais pour piloter avec sérénité, transparence et confiance.

---

*La finance moderne ne se contente plus d'enregistrer.
Elle démontre.*
MARKDOWN;

$excerpt = "Quand on parle de fiabilité des chiffres, beaucoup pensent immédiatement à l'audit, à la conformité ou aux grandes entreprises. Pourtant, la question se pose aujourd'hui pour toutes les structures : indépendants, PME, filiales, jusqu'aux ETI.";

// Vérifier si l'article existe déjà
$existing = $entityManager->getRepository(\App\Entity\Article::class)->findOneBy(['slug' => $slug]);
if ($existing) {
    echo "⚠️  Un article avec le slug '{$slug}' existe déjà.\n";
    echo "   ID: {$existing->getId()}\n";
    echo "   Titre: {$existing->getTitle()}\n";
    exit(1);
}

// Créer l'article
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

$entityManager->persist($article);
$entityManager->flush();

echo "✅ Article créé avec succès !\n";
echo "   ID: {$article->getId()}\n";
echo "   Titre: {$article->getTitle()}\n";
echo "   Slug: {$article->getSlug()}\n";
echo "   Catégorie: {$article->getCategory()}\n";
echo "   Statut: {$article->getStatus()}\n";
echo "   URL: /blog/{$article->getSlug()}\n";
