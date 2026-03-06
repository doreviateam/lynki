<?php

namespace App\Controller;

use App\Repository\ArticleRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Sitemap Controller
 * 
 * Génère le sitemap XML pour le SEO.
 */
class SitemapController extends AbstractController
{
    #[Route('/sitemap.xml', name: 'sitemap', methods: ['GET'])]
    public function sitemap(ArticleRepository $articleRepository, Request $request): Response
    {
        // Utiliser l'URL de la requête actuelle comme base
        $baseUrl = $request->getSchemeAndHttpHost();
        
        $urls = [
            [
                'loc' => $baseUrl . $this->generateUrl('home'),
                'changefreq' => 'weekly',
                'priority' => '1.0',
            ],
            [
                'loc' => $baseUrl . $this->generateUrl('how_it_works'),
                'changefreq' => 'monthly',
                'priority' => '0.8',
            ],
            [
                'loc' => $baseUrl . $this->generateUrl('features'),
                'changefreq' => 'monthly',
                'priority' => '0.8',
            ],
            [
                'loc' => $baseUrl . $this->generateUrl('pricing'),
                'changefreq' => 'monthly',
                'priority' => '0.9',
            ],
            [
                'loc' => $baseUrl . $this->generateUrl('contact'),
                'changefreq' => 'monthly',
                'priority' => '0.7',
            ],
            [
                'loc' => $baseUrl . $this->generateUrl('blog_index'),
                'changefreq' => 'weekly',
                'priority' => '0.8',
            ],
        ];

        // Ajouter les articles du blog
        $articles = $articleRepository->findPublishedArticles();
        foreach ($articles as $article) {
            $urls[] = [
                'loc' => $baseUrl . $this->generateUrl('blog_show', ['slug' => $article->getSlug()]),
                'changefreq' => 'monthly',
                'priority' => '0.7',
                'lastmod' => $article->getUpdatedAt()?->format('Y-m-d'),
            ];
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        
        foreach ($urls as $url) {
            $xml .= '  <url>' . "\n";
            $xml .= '    <loc>' . htmlspecialchars($url['loc'], ENT_XML1, 'UTF-8') . '</loc>' . "\n";
            $xml .= '    <changefreq>' . htmlspecialchars($url['changefreq'], ENT_XML1, 'UTF-8') . '</changefreq>' . "\n";
            $xml .= '    <priority>' . htmlspecialchars($url['priority'], ENT_XML1, 'UTF-8') . '</priority>' . "\n";
            if (isset($url['lastmod'])) {
                $xml .= '    <lastmod>' . htmlspecialchars($url['lastmod'], ENT_XML1, 'UTF-8') . '</lastmod>' . "\n";
            }
            $xml .= '  </url>' . "\n";
        }
        
        $xml .= '</urlset>';

        return new Response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
        ]);
    }
}
