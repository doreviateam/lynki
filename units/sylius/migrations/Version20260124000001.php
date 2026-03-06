<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration: Ajout des champs blog selon SPEC v1.0
 * - category: catégorie de l'article (obligatoire, max 1)
 * - tags: tags de l'article (facultatif, max 6)
 * - chapeau: introduction courte (2-3 lignes)
 * - featured: mise en avant sur la page listing
 */
final class Version20260124000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add blog fields to articles table: category, tags, chapeau, featured';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE articles ADD COLUMN category VARCHAR(100) DEFAULT NULL');
        $this->addSql('ALTER TABLE articles ADD COLUMN tags JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE articles ADD COLUMN chapeau TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE articles ADD COLUMN featured BOOLEAN DEFAULT FALSE');
        $this->addSql('CREATE INDEX idx_articles_category ON articles (category)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS idx_articles_category');
        $this->addSql('ALTER TABLE articles DROP COLUMN IF EXISTS category');
        $this->addSql('ALTER TABLE articles DROP COLUMN IF EXISTS tags');
        $this->addSql('ALTER TABLE articles DROP COLUMN IF EXISTS chapeau');
        $this->addSql('ALTER TABLE articles DROP COLUMN IF EXISTS featured');
    }
}
