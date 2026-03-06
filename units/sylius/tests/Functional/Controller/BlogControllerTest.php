<?php

namespace App\Tests\Functional\Controller;

use App\Entity\Article;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class BlogControllerTest extends WebTestCase
{
    private EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
    }

    public function testBlogIndex(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/blog');

        $this->assertResponseIsSuccessful();
        $this->assertSelectorTextContains('h2', 'Actualités et guides');
    }

    public function testBlogIndexWithPagination(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/blog?page=1');

        $this->assertResponseIsSuccessful();
    }

    public function testBlogShowWithValidSlug(): void
    {
        // Créer un article de test
        $article = new Article();
        $article->setTitle('Test Article');
        $article->setSlug('test-article');
        $article->setContent('Test content');
        $article->setAuthor('Test Author');
        $article->setExcerpt('Test excerpt');
        $article->setPublishedAt(new \DateTimeImmutable());
        $article->setStatus('published');

        $this->entityManager->persist($article);
        $this->entityManager->flush();

        $client = static::createClient();
        $crawler = $client->request('GET', '/blog/test-article');

        $this->assertResponseIsSuccessful();
        $this->assertSelectorTextContains('h1', 'Test Article');
        
        // Vérifier que les vues sont incrémentées
        $this->entityManager->refresh($article);
        $this->assertGreaterThan(0, $article->getViews());

        // Nettoyer
        $this->entityManager->remove($article);
        $this->entityManager->flush();
    }

    public function testBlogShowWithInvalidSlug(): void
    {
        $client = static::createClient();
        $client->request('GET', '/blog/invalid-slug-12345');

        $this->assertResponseStatusCodeSame(404);
    }

    public function testBlogShowWithDraftArticle(): void
    {
        // Créer un article en brouillon
        $article = new Article();
        $article->setTitle('Draft Article');
        $article->setSlug('draft-article');
        $article->setContent('Draft content');
        $article->setAuthor('Test Author');
        $article->setStatus('draft');

        $this->entityManager->persist($article);
        $this->entityManager->flush();

        $client = static::createClient();
        $client->request('GET', '/blog/draft-article');

        // Les articles en brouillon ne doivent pas être accessibles
        $this->assertResponseStatusCodeSame(404);

        // Nettoyer
        $this->entityManager->remove($article);
        $this->entityManager->flush();
    }

    public function testBlogShowSecurityHeaders(): void
    {
        $client = static::createClient();
        $client->request('GET', '/blog');

        $response = $client->getResponse();
        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('X-Content-Type-Options', 'nosniff');
        $this->assertResponseHeaderSame('X-Frame-Options', 'SAMEORIGIN');
        $this->assertResponseHeaderSame('X-XSS-Protection', '1; mode=block');
    }
}
