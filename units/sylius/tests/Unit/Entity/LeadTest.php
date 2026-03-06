<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Lead;
use PHPUnit\Framework\TestCase;

class LeadTest extends TestCase
{
    public function testLeadEntityValidation(): void
    {
        $lead = new Lead();
        
        // Test validation email (obligatoire)
        $lead->setEmail('test@example.com');
        $this->assertEquals('test@example.com', $lead->getEmail());
        
        // Test validation role (obligatoire)
        $lead->setRole('dirigeant');
        $this->assertEquals('dirigeant', $lead->getRole());
        
        // Test champs optionnels
        $lead->setStack('Odoo');
        $lead->setVolume('100 factures/mois');
        $lead->setMessage('Message de test');
        
        $this->assertEquals('Odoo', $lead->getStack());
        $this->assertEquals('100 factures/mois', $lead->getVolume());
        $this->assertEquals('Message de test', $lead->getMessage());
        
        // Test UTM parameters
        $lead->setUtmSource('google');
        $lead->setUtmCampaign('campaign1');
        $lead->setUtmMedium('cpc');
        $lead->setUtmContent('ad1');
        
        $this->assertEquals('google', $lead->getUtmSource());
        $this->assertEquals('campaign1', $lead->getUtmCampaign());
        $this->assertEquals('cpc', $lead->getUtmMedium());
        $this->assertEquals('ad1', $lead->getUtmContent());
        
        // Test status workflow
        $lead->setStatus('pending');
        $this->assertEquals('pending', $lead->getStatus());
        
        // Test Odoo sync status
        $lead->markAsSyncPending();
        $this->assertEquals('pending', $lead->getOdooSyncStatus());
        
        $lead->markAsSynced(123);
        $this->assertEquals('synced', $lead->getOdooSyncStatus());
        $this->assertEquals(123, $lead->getOdooLeadId());
        $this->assertNotNull($lead->getOdooSyncedAt());
        
        $lead->markAsSyncFailed();
        $this->assertEquals('failed', $lead->getOdooSyncStatus());
    }
    
    public function testLeadCanSyncToOdoo(): void
    {
        $lead = new Lead();
        $lead->setEmail('test@example.com');
        
        // Lead sans email ne peut pas être synchronisé
        $leadWithoutEmail = new Lead();
        $this->assertFalse($leadWithoutEmail->canSyncToOdoo());
        
        // Lead avec email et pas encore synchronisé peut être synchronisé
        $this->assertTrue($lead->canSyncToOdoo());
        
        // Lead déjà synchronisé ne peut pas être re-synchronisé
        $lead->markAsSynced(123);
        $this->assertFalse($lead->canSyncToOdoo());
    }
    
    public function testLeadPublicUuidGeneration(): void
    {
        $lead = new Lead();
        $lead->setEmail('test@example.com');
        
        // Le publicUuid devrait être généré automatiquement lors du persist
        // Pour ce test, on vérifie qu'il est null avant persist
        $this->assertNull($lead->getPublicUuid());
    }
}
