<?php

namespace App\Command;

use App\Repository\LeadRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Commande de nettoyage RGPD des leads
 * 
 * Supprime automatiquement les leads créés il y a plus de 24 mois,
 * conformément à la politique de conservation RGPD.
 * 
 * Exécution recommandée : quotidienne via CRON
 */
#[AsCommand(
    name: 'app:cleanup-leads',
    description: 'Supprime les leads créés il y a plus de 24 mois (RGPD)',
)]
class CleanupLeadsCommand extends Command
{
    public function __construct(
        private LeadRepository $leadRepository,
        private EntityManagerInterface $entityManager,
        private LoggerInterface $logger
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Nettoyage RGPD des leads');

        // Date limite : il y a 24 mois
        $cutoffDate = new \DateTimeImmutable('-24 months');
        
        $io->info(sprintf(
            'Suppression des leads créés avant le %s',
            $cutoffDate->format('Y-m-d H:i:s')
        ));

        // Rechercher les leads à supprimer
        $leadsToDelete = $this->leadRepository->findLeadsToDelete($cutoffDate);
        $count = count($leadsToDelete);

        if ($count === 0) {
            $io->success('Aucun lead à supprimer.');
            $this->logger->info('CleanupLeadsCommand: Aucun lead à supprimer', [
                'cutoff_date' => $cutoffDate->format(\DateTimeInterface::ATOM),
            ]);
            return Command::SUCCESS;
        }

        $io->warning(sprintf(
            '%d lead(s) vont être supprimé(s).',
            $count
        ));

        // Supprimer les leads
        $deletedCount = 0;
        $errorCount = 0;

        foreach ($leadsToDelete as $lead) {
            try {
                $this->entityManager->remove($lead);
                $deletedCount++;
            } catch (\Exception $e) {
                $errorCount++;
                $this->logger->error('Erreur lors de la suppression d\'un lead', [
                    'lead_id' => $lead->getId(),
                    'public_uuid' => $lead->getPublicUuid(),
                    'created_at' => $lead->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Flush toutes les suppressions
        try {
            $this->entityManager->flush();
            
            $io->success(sprintf(
                '%d lead(s) supprimé(s) avec succès.',
                $deletedCount
            ));

            if ($errorCount > 0) {
                $io->warning(sprintf(
                    '%d erreur(s) lors de la suppression.',
                    $errorCount
                ));
            }

            $this->logger->info('CleanupLeadsCommand: Nettoyage terminé', [
                'cutoff_date' => $cutoffDate->format(\DateTimeInterface::ATOM),
                'total_found' => $count,
                'deleted' => $deletedCount,
                'errors' => $errorCount,
            ]);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $io->error(sprintf(
                'Erreur lors de la suppression : %s',
                $e->getMessage()
            ));

            $this->logger->error('CleanupLeadsCommand: Erreur fatale', [
                'cutoff_date' => $cutoffDate->format(\DateTimeInterface::ATOM),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return Command::FAILURE;
        }
    }
}
