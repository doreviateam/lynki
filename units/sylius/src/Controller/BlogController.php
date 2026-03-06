<?php

namespace App\Controller;

use App\Entity\Article;
use App\Repository\ArticleRepository;
use App\Service\MarkdownService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Blog Controller
 * 
 * Gère l'affichage public du blog Dorevia-Vault.
 */
class BlogController extends AbstractController
{
    #[Route('/blog', name: 'blog_index', methods: ['GET'])]
    public function index(ArticleRepository $articleRepository, Request $request): Response
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $category = $request->query->get('category');
        $search = trim($request->query->get('search', ''));
        $limit = 10;
        $offset = ($page - 1) * $limit;

        // Récupérer l'article mis en avant (featured) - seulement si pas de recherche
        $featuredArticle = null;
        if (empty($search) && $page === 1) {
            $allArticles = $articleRepository->findPublishedArticles(1000);
            foreach ($allArticles as $article) {
                if ($article->isFeatured()) {
                    $featuredArticle = $article;
                    break;
                }
            }
            // Si aucun featured, prendre le premier article
            if (!$featuredArticle && !empty($allArticles)) {
                $featuredArticle = $allArticles[0];
            }
        }

        // Articles pour la grille (recherche, catégorie, ou tous)
        if (!empty($search)) {
            // Recherche plein texte
            $articles = $articleRepository->searchPublished($search, $limit, $offset);
            $totalArticles = $articleRepository->countSearchResults($search);
        } elseif ($category) {
            // Filtre par catégorie
            $articles = $articleRepository->findPublishedByCategory($category, $limit, $offset);
            $totalArticles = count($articleRepository->findPublishedByCategory($category, 1000));
        } else {
            // Tous les articles
            $articles = $articleRepository->findPublishedArticles($limit, $offset);
            $totalArticles = $articleRepository->countPublished();
        }

        // Exclure le featured de la grille si page 1 et pas de recherche
        if (empty($search) && $page === 1 && $featuredArticle) {
            $articles = array_filter($articles, function($a) use ($featuredArticle) {
                return $a->getId() !== $featuredArticle->getId();
            });
            $articles = array_values($articles); // Réindexer
        }

        $totalPages = ceil($totalArticles / $limit);
        $categories = $articleRepository->findAllCategories();

        // Catégories thématiques selon la spec
        $themeCategories = [
            'Conformité & réglementation',
            'ERP & Odoo CE',
            'Trésorerie & pilotage',
            'Preuve & audit',
            'Architecture & sécurité'
        ];

        // Compter les articles par catégorie thématique
        $categoryCounts = [];
        foreach ($themeCategories as $themeCat) {
            $categoryCounts[$themeCat] = $articleRepository->countByCategory($themeCat);
        }

        // Total d'articles publiés (pour le filtre "Tous")
        $totalPublished = $articleRepository->countPublished();

        return $this->render('blog/index.html.twig', [
            'featured_article' => $featuredArticle,
            'articles' => $articles,
            'current_page' => $page,
            'total_pages' => $totalPages,
            'total_articles' => $totalArticles,
            'total_published' => $totalPublished,
            'current_category' => $category,
            'current_search' => $search,
            'categories' => $categories,
            'category_counts' => $categoryCounts,
            'page_title' => 'Blog Dorevia-Vault — Journal d\'infrastructure de preuve financière',
            'page_description' => 'Articles sur la preuve financière, la conformité, les ERP et l\'infrastructure de vérité. Explications, clarifications, structure — sans marketing.',
        ]);
    }

    #[Route('/blog/{slug}', name: 'blog_show', methods: ['GET'])]
    public function show(string $slug, ArticleRepository $articleRepository, EntityManagerInterface $entityManager, MarkdownService $markdownService): Response
    {
        $article = $articleRepository->findBySlug($slug);

        if (!$article) {
            throw $this->createNotFoundException('Article non trouvé');
        }

        // Incrémenter le compteur de vues
        $article->incrementViews();
        $entityManager->flush();

        // Articles liés (même catégorie, max 3)
        $relatedArticles = $articleRepository->findRelatedArticles($article, 3);

        // Convertir le contenu Markdown en HTML
        $htmlContent = $markdownService->toHtml($article->getContent());

        return $this->render('blog/show.html.twig', [
            'article' => $article,
            'html_content' => $htmlContent,
            'related_articles' => $relatedArticles,
            'page_title' => $article->getTitle() . ' — Blog Dorevia-Vault',
            'page_description' => $article->getMetaDescription() ?: $article->getExcerpt(),
        ]);
    }
}
