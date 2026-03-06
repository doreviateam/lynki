<?php

require_once __DIR__ . '/../vendor/autoload.php';

$kernel = new \App\Kernel($_ENV['APP_ENV'] ?? 'dev', (bool) ($_ENV['APP_DEBUG'] ?? false));
$kernel->boot();

$em = $kernel->getContainer()->get('doctrine.orm.entity_manager');
$article = $em->getRepository(\App\Entity\Article::class)->find(4);

if (!$article) {
    echo "❌ Article non trouvé\n";
    exit(1);
}

$content = $article->getContent();

// Nouvelle phrase à ajouter
$newPhrase = "Ce mouvement est d'ailleurs renforcé par les évolutions réglementaires à venir (LNE 2026, normes de sécurisation des systèmes de caisse type NF525), qui exigent une traçabilité et une intégrité toujours plus fortes des données financières.";

// Insérer après "La fiabilité financière devient un standard de bonne gestion."
$content = str_replace(
    "La fiabilité financière devient un standard de bonne gestion.",
    "La fiabilité financière devient un standard de bonne gestion.\n\n" . $newPhrase,
    $content
);

$article->setContent($content);
$em->flush();

echo "✅ Contenu mis à jour avec la phrase sur LNE 2026 et NF525 !\n";
echo "   Titre: {$article->getTitle()}\n";
echo "   URL: /blog/{$article->getSlug()}\n";
