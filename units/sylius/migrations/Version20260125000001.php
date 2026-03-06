<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration pour rendre la catégorie obligatoire pour les articles
 * 
 * 1. Assigner une catégorie par défaut aux articles sans catégorie
 * 2. Rendre la colonne category NOT NULL
 */
final class Version20260125000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rendre la catégorie obligatoire pour les articles (assigner une catégorie par défaut aux articles existants sans catégorie)';
    }

    public function up(Schema $schema): void
    {
        // 1. Assigner une catégorie par défaut aux articles sans catégorie
        $this->addSql("
            UPDATE articles 
            SET category = 'Conformité & réglementation' 
            WHERE category IS NULL AND status = 'published'
        ");

        // 2. Pour les brouillons sans catégorie, assigner aussi une catégorie par défaut
        $this->addSql("
            UPDATE articles 
            SET category = 'Conformité & réglementation' 
            WHERE category IS NULL
        ");

        // 3. Rendre la colonne NOT NULL
        $this->addSql('ALTER TABLE articles MODIFY category VARCHAR(100) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // Rendre la colonne nullable à nouveau
        $this->addSql('ALTER TABLE articles MODIFY category VARCHAR(100) NULL');
    }
}
