<?php

namespace App\Command;

use App\Repository\ArticleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Commande pour associer des catégories aux articles existants
 * 
 * Analyse le contenu des articles pour déterminer la catégorie la plus appropriée,
 * ou assigne une catégorie par défaut.
 */
#[AsCommand(
    name: 'app:assign-categories-to-articles',
    description: 'Associe une catégorie aux articles existants sans catégorie',
)]
class AssignCategoriesToArticlesCommand extends Command
{
    // Catégories disponibles selon la spec
    private const CATEGORIES = [
        'Conformité & réglementation',
        'ERP & Odoo CE',
        'Trésorerie & pilotage',
        'Preuve & audit',
        'Architecture & sécurité',
    ];

    // Mots-clés pour détecter automatiquement la catégorie
    private const KEYWORDS = [
        'Conformité & réglementation' => [
            'conformité', 'réglementation', 'nf525', 'lne', '2026', 'fiscal', 'fiscale',
            'obligation', 'légale', 'loi', 'décret', 'réglement', 'compliance'
        ],
        'ERP & Odoo CE' => [
            'odoo', 'erp', 'intégration', 'module', 'connector', 'connecteur',
            'community edition', 'ce', 'installation', 'configuration', 'migration'
        ],
        'Trésorerie & pilotage' => [
            'trésorerie', 'pilotage', 'finance', 'financier', 'cash', 'flux',
            'budget', 'prévision', 'tableau de bord', 'kpi', 'indicateur'
        ],
        'Preuve & audit' => [
            'preuve', 'audit', 'vérification', 'traçabilité', 'intégrité',
            'opposable', 'juridique', 'scellage', 'horodatage', 'hash'
        ],
        'Architecture & sécurité' => [
            'architecture', 'sécurité', 'infrastructure', 'api', 'cryptographie',
            'chiffrement', 'authentification', 'autorisation', 'sécurisé'
        ],
    ];

    public function __construct(
        private EntityManagerInterface $entityManager,
        private ArticleRepository $articleRepository
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption(
                'default-category',
                'd',
                InputOption::VALUE_OPTIONAL,
                'Catégorie par défaut pour les articles sans correspondance',
                'Conformité & réglementation'
            )
            ->addOption(
                'dry-run',
                null,
                InputOption::VALUE_NONE,
                'Affiche ce qui serait fait sans modifier la base de données'
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Association de catégories aux articles');

        $defaultCategory = $input->getOption('default-category');
        $dryRun = $input->getOption('dry-run');

        // Vérifier que la catégorie par défaut est valide
        if (!in_array($defaultCategory, self::CATEGORIES, true)) {
            $io->error(sprintf(
                'Catégorie par défaut invalide : "%s". Catégories valides : %s',
                $defaultCategory,
                implode(', ', self::CATEGORIES)
            ));
            return Command::FAILURE;
        }

        // Récupérer tous les articles sans catégorie
        $articles = $this->articleRepository->createQueryBuilder('a')
            ->where('a.category IS NULL OR a.category = :empty')
            ->setParameter('empty', '')
            ->getQuery()
            ->getResult();

        if (empty($articles)) {
            $io->success('Tous les articles ont déjà une catégorie.');
            return Command::SUCCESS;
        }

        $io->info(sprintf('Trouvé %d article(s) sans catégorie.', count($articles)));

        if ($dryRun) {
            $io->note('Mode DRY-RUN : aucune modification ne sera effectuée.');
        }

        $stats = array_fill_keys(self::CATEGORIES, 0);
        $updated = 0;
        $errors = 0;

        $table = $io->createTable();
        $table->setHeaders(['Article', 'Catégorie assignée', 'Méthode']);

        foreach ($articles as $article) {
            try {
                $category = $this->detectCategory($article);
                
                if ($category === null) {
                    $category = $defaultCategory;
                    $method = 'Par défaut';
                } else {
                    $method = 'Détection automatique';
                }

                $table->addRow([
                    $article->getTitle(),
                    $category,
                    $method
                ]);

                if (!$dryRun) {
                    $article->setCategory($category);
                    $this->entityManager->persist($article);
                }

                $stats[$category]++;
                $updated++;

            } catch (\Exception $e) {
                $io->error(sprintf(
                    'Erreur pour l\'article "%s" : %s',
                    $article->getTitle(),
                    $e->getMessage()
                ));
                $errors++;
            }
        }

        $table->render();

        if (!$dryRun) {
            try {
                $this->entityManager->flush();
                $io->success(sprintf('%d article(s) mis à jour avec succès.', $updated));
            } catch (\Exception $e) {
                $io->error(sprintf('Erreur lors de la sauvegarde : %s', $e->getMessage()));
                return Command::FAILURE;
            }
        } else {
            $io->note(sprintf('%d article(s) seraient mis à jour.', $updated));
        }

        // Afficher les statistiques
        $io->section('Statistiques par catégorie');
        foreach ($stats as $category => $count) {
            if ($count > 0) {
                $io->text(sprintf('  %s : %d article(s)', $category, $count));
            }
        }

        if ($errors > 0) {
            $io->warning(sprintf('%d erreur(s) rencontrée(s).', $errors));
        }

        return Command::SUCCESS;
    }

    /**
     * Détecte la catégorie la plus appropriée pour un article
     * en analysant son titre, extrait et contenu
     */
    private function detectCategory($article): ?string
    {
        $text = strtolower(
            ($article->getTitle() ?? '') . ' ' .
            ($article->getExcerpt() ?? '') . ' ' .
            ($article->getContent() ?? '')
        );

        $scores = [];
        foreach (self::KEYWORDS as $category => $keywords) {
            $score = 0;
            foreach ($keywords as $keyword) {
                $score += substr_count($text, strtolower($keyword));
            }
            if ($score > 0) {
                $scores[$category] = $score;
            }
        }

        if (empty($scores)) {
            return null;
        }

        // Retourner la catégorie avec le score le plus élevé
        arsort($scores);
        return array_key_first($scores);
    }
}
