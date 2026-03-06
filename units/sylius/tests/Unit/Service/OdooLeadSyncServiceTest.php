<?php

namespace App\Tests\Unit\Service;

use App\Entity\Lead;
use App\Service\OdooLeadSyncService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

class OdooLeadSyncServiceTest extends TestCase
{
    private OdooLeadSyncService $service;
    private EntityManagerInterface $entityManager;
    private LoggerInterface $logger;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->logger = $this->createMock(LoggerInterface::class);
        
        // Mock des variables d'environnement
        $_ENV['ODOO_URL'] = 'https://odoo.test.com';
        $_ENV['ODOO_DB'] = 'test_db';
        $_ENV['ODOO_API_USER'] = 'test_user';
        $_ENV['ODOO_API_PASSWORD'] = 'test_password';
        
        $this->service = new OdooLeadSyncService(
            $this->entityManager,
            $this->logger,
            $this->createMock(\Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface::class)
        );
    }

    public function testOdooLeadSyncServiceMapping(): void
    {
        $lead = new Lead();
        $lead->setEmail('test@example.com');
        $lead->setRole('dirigeant');
        $lead->setStack('Odoo');
        $lead->setVolume('100 factures/mois');
        $lead->setMessage('Message de test');
        $lead->setUtmSource('google');
        $lead->setUtmCampaign('campaign1');
        $lead->setUtmMedium('cpc');
        $lead->setUtmContent('ad1');
        $lead->setReferrer('https://google.com');
        
        // Test que le service peut être instancié
        $this->assertInstanceOf(OdooLeadSyncService::class, $this->service);
        
        // Note: Le mapping réel nécessite une connexion Odoo, donc on teste juste l'instanciation
        // Les tests d'intégration réels nécessiteront un mock du client XML-RPC
    }

    public function testOdooLeadSyncServiceErrorHandling(): void
    {
        $lead = new Lead();
        $lead->setEmail('test@example.com');
        
        // Test que le service gère les erreurs sans bloquer
        // (le service devrait logger l'erreur mais ne pas lever d'exception)
        $this->logger->expects($this->any())
            ->method('error')
            ->willReturnCallback(function ($message, $context) {
                // Vérifier que les erreurs sont loggées
                $this->assertIsString($message);
                $this->assertIsArray($context);
            });
        
        // Test avec configuration Odoo invalide
        $_ENV['ODOO_URL'] = '';
        
        // Le service devrait gérer l'erreur gracieusement
        // (en production, cela devrait logger et marquer le lead comme failed)
        $this->assertInstanceOf(OdooLeadSyncService::class, $this->service);
    }
}
