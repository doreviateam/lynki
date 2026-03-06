<?php

/**
 * Script pour créer un article de blog
 * Usage: php scripts/create_article.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Symfony\Component\Dotenv\Dotenv;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\ORMSetup;
use App\Entity\Article;

// Charger les variables d'environnement
$dotenv = new Dotenv();
$dotenv->load(__DIR__ . '/../.env');

// Configuration Doctrine
$config = ORMSetup::createAttributeMetadataConfiguration(
    [__DIR__ . '/../src/Entity'],
    true
);

// Connexion à la base de données
$connectionParams = [
    'url' => $_ENV['DATABASE_URL'] ?? 'postgresql://user:password@localhost:5432/dbname',
];

$connection = \Doctrine\DBAL\DriverManager::getConnection($connectionParams);
$entityManager = new EntityManager($connection, $config);

// Fonction pour créer un article
function createArticle(EntityManager $em, array $data): Article
{
    $article = new Article();
    
    // Générer le slug depuis le titre si non fourni
    $slug = $data['slug'] ?? strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['title'])));
    
    $article->setTitle($data['title']);
    $article->setSlug($slug);
    $article->setContent($data['content']);
    $article->setExcerpt($data['excerpt'] ?? substr(strip_tags($data['content']), 0, 200) . '...');
    $article->setAuthor($data['author']);
    $article->setCategory($data['category']);
    $article->setStatus($data['status'] ?? 'published');
    
    if (isset($data['publishedAt'])) {
        $article->setPublishedAt(new \DateTimeImmutable($data['publishedAt']));
    } else {
        $article->setPublishedAt(new \DateTimeImmutable());
    }
    
    if (isset($data['metaDescription'])) {
        $article->setMetaDescription($data['metaDescription']);
    }
    
    if (isset($data['coverImage'])) {
        $article->setCoverImage($data['coverImage']);
    }
    
    if (isset($data['featured']) && $data['featured']) {
        $article->setFeatured(true);
    }
    
    $em->persist($article);
    $em->flush();
    
    return $article;
}

// Exemple d'utilisation
if (php_sapi_name() === 'cli') {
    echo "=== Création d'un article de blog ===\n\n";
    
    // Données de l'article (à modifier selon vos besoins)
    $articleData = [
        'title' => 'Exemple d\'article de blog',
        'slug' => 'exemple-article-blog',
        'content' => '# Titre de l\'article

Ceci est un **exemple de contenu** pour votre article de blog.

## Section 1

Vous pouvez utiliser du Markdown pour formater votre contenu.

- Liste à puces
- Autre élément
- Encore un autre

## Section 2

Du texte avec du **gras** et de l\'*italique*.

> Citation importante

Et du code :

```php
<?php
echo "Hello World";
```

## Conclusion

Voilà un exemple d\'article complet.',
        'excerpt' => 'Ceci est un exemple d\'extrait qui apparaîtra dans la liste des articles.',
        'author' => 'Dorevia Team',
        'category' => 'Conformité & réglementation',
        'status' => 'published',
        'metaDescription' => 'Exemple d\'article de blog pour Dorevia-Vault',
        'featured' => false,
    ];
    
    try {
        $article = createArticle($entityManager, $articleData);
        echo "✅ Article créé avec succès !\n";
        echo "   ID: {$article->getId()}\n";
        echo "   Titre: {$article->getTitle()}\n";
        echo "   Slug: {$article->getSlug()}\n";
        echo "   URL: /blog/{$article->getSlug()}\n";
    } catch (\Exception $e) {
        echo "❌ Erreur lors de la création de l'article :\n";
        echo "   " . $e->getMessage() . "\n";
        exit(1);
    }
}
