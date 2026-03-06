<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260116000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create leads table for Dorevia-Vault landing page';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE leads (
            id SERIAL PRIMARY KEY,
            public_uuid UUID NOT NULL UNIQUE,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            email VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            stack VARCHAR(255) DEFAULT NULL,
            volume TEXT DEFAULT NULL,
            message TEXT DEFAULT NULL,
            utm_source VARCHAR(255) DEFAULT NULL,
            utm_campaign VARCHAR(255) DEFAULT NULL,
            utm_medium VARCHAR(255) DEFAULT NULL,
            utm_content VARCHAR(255) DEFAULT NULL,
            referrer TEXT DEFAULT NULL,
            status VARCHAR(50) NOT NULL DEFAULT \'new\',
            ip_hash VARCHAR(64) DEFAULT NULL,
            user_agent TEXT DEFAULT NULL,
            odoo_lead_id INTEGER DEFAULT NULL,
            odoo_sync_status VARCHAR(50) DEFAULT NULL,
            odoo_synced_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL
        )');
        $this->addSql('CREATE INDEX idx_leads_email ON leads (email)');
        $this->addSql('CREATE INDEX idx_leads_status ON leads (status)');
        $this->addSql('CREATE INDEX idx_leads_created_at ON leads (created_at)');
        $this->addSql('CREATE INDEX idx_leads_odoo_sync_status ON leads (odoo_sync_status)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE IF EXISTS leads');
    }
}
