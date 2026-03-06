<?php

namespace App\Command;

use App\Entity\Article;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\String\Slugger\SluggerInterface;

#[AsCommand(
    name: 'app:create-article',
    description: 'Crée un nouvel article de blog',
)]
class CreateArticleCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private SluggerInterface $slugger
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('title', 't', InputOption::VALUE_REQUIRED, 'Titre de l\'article')
            ->addOption('category', 'c', InputOption::VALUE_REQUIRED, 'Catégorie (Conformité & réglementation, ERP & Odoo CE, Trésorerie & pilotage, Preuve & audit, Architecture & sécurité)')
            ->addOption('author', 'a', InputOption::VALUE_REQUIRED, 'Auteur', 'Dorevia Team')
            ->addOption('slug', 's', InputOption::VALUE_OPTIONAL, 'Slug (généré automatiquement si non fourni)')
            ->addOption('content', null, InputOption::VALUE_OPTIONAL, 'Contenu (Markdown)')
            ->addOption('excerpt', null, InputOption::VALUE_OPTIONAL, 'Extrait')
            ->addOption('featured', 'f', InputOption::VALUE_NONE, 'Mettre en avant')
            ->addOption('draft', 'd', InputOption::VALUE_NONE, 'Créer en brouillon');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        
        $io->title('Création d\'un nouvel article de blog');

        // Récupérer ou demander les informations
        $title = $input->getOption('title');
        if (!$title) {
            $title = $io->ask('Titre de l\'article', null, function ($value) {
                if (empty($value)) {
                    throw new \RuntimeException('Le titre est obligatoire');
                }
                return $value;
            });
        }

        $category = $input->getOption('category');
        if (!$category) {
            $category = $io->choice(
                'Catégorie',
                [
                    'Conformité & réglementation',
                    'ERP & Odoo CE',
                    'Trésorerie & pilotage',
                    'Preuve & audit',
                    'Architecture & sécurité',
                ],
                'Conformité & réglementation'
            );
        }

        $author = $input->getOption('author');
        if (!$author) {
            $author = $io->ask('Auteur', 'Dorevia Team');
        }

        $slug = $input->getOption('slug');
        if (!$slug) {
            $slug = strtolower($this->slugger->slug($title)->toString());
        }

        // Vérifier si le slug existe déjà
        $existing = $this->entityManager->getRepository(Article::class)->findOneBy(['slug' => $slug]);
        if ($existing) {
            $io->warning("Un article avec le slug '{$slug}' existe déjà.");
            if (!$io->confirm('Voulez-vous continuer avec un slug différent ?', false)) {
                return Command::FAILURE;
            }
            $slug = $io->ask('Nouveau slug', $slug . '-' . time());
        }

        $content = $input->getOption('content');
        if (!$content) {
            $io->note('Contenu de l\'article (Markdown). Tapez votre contenu, puis appuyez sur Entrée deux fois pour terminer.');
            $content = $io->ask('Contenu', null, function ($value) {
                if (empty($value)) {
                    throw new \RuntimeException('Le contenu est obligatoire');
                }
                return $value;
            });
        }

        $excerpt = $input->getOption('excerpt');
        if (!$excerpt) {
            $excerpt = substr(strip_tags($content), 0, 200);
            if (strlen($content) > 200) {
                $excerpt .= '...';
            }
            $excerpt = $io->ask('Extrait (description courte)', $excerpt);
        }

        $featured = $input->getOption('featured');
        if (!$featured) {
            $featured = $io->confirm('Mettre en avant (article à la une) ?', false);
        }

        $isDraft = $input->getOption('draft');
        $status = $isDraft ? 'draft' : 'published';

        // Créer l'article
        $article = new Article();
        $article->setTitle($title);
        $article->setSlug($slug);
        $article->setContent($content);
        $article->setExcerpt($excerpt);
        $article->setAuthor($author);
        $article->setCategory($category);
        $article->setStatus($status);
        $article->setFeatured($featured);
        
        if (!$isDraft) {
            $article->setPublishedAt(new \DateTimeImmutable());
        }

        $this->entityManager->persist($article);
        $this->entityManager->flush();

        $io->success([
            'Article créé avec succès !',
            '',
            "ID: {$article->getId()}",
            "Titre: {$article->getTitle()}",
            "Slug: {$article->getSlug()}",
            "Catégorie: {$article->getCategory()}",
            "Statut: {$article->getStatus()}",
            "URL: /blog/{$article->getSlug()}",
        ]);

        return Command::SUCCESS;
    }
}
