<?php

namespace App\Command;

use App\Entity\Article;
use App\Repository\ArticleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:update-blog-articles-images',
    description: 'Met à jour les images de couverture des articles avec des images Unsplash',
)]
class UpdateBlogArticlesImagesCommand extends Command
{
    // Mapping slug -> image Unsplash
    private const IMAGE_MAPPING = [
        'pourquoi-securiser-factures-dorevia-vault' => 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=600&fit=crop&q=80',
        'regle-3v-valide-vault-verifiable' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&q=80',
        'integration-dorevia-vault-odoo-guide' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop&q=80',
    ];

    // Image par défaut pour les articles sans mapping
    private const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop&q=80';

    public function __construct(
        private EntityManagerInterface $entityManager,
        private ArticleRepository $articleRepository
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $articles = $this->articleRepository->findAll();
        $updated = 0;
        $skipped = 0;

        $io->progressStart(count($articles));

        foreach ($articles as $article) {
            // Si l'article a déjà une image, on la garde (sauf si c'est une image par défaut)
            if ($article->getCoverImage() && !str_contains($article->getCoverImage(), 'unsplash.com')) {
                $io->progressAdvance();
                $skipped++;
                continue;
            }

            // Utiliser le mapping ou l'image par défaut
            $imageUrl = self::IMAGE_MAPPING[$article->getSlug()] ?? self::DEFAULT_IMAGE;
            
            $article->setCoverImage($imageUrl);
            $this->entityManager->persist($article);
            $updated++;
            $io->progressAdvance();
        }

        $this->entityManager->flush();
        $io->progressFinish();

        $io->success(sprintf('✅ %d articles mis à jour avec des images Unsplash ! (%d ignorés)', $updated, $skipped));

        return Command::SUCCESS;
    }
}
