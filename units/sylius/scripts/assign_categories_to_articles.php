<?php
/**
 * Script pour associer des catégories aux articles existants
 * 
 * Usage: php scripts/assign_categories_to_articles.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Symfony\Component\Dotenv\Dotenv;

// Charger les variables d'environnement
$dotenv = new Dotenv();
$dotenv->load(__DIR__ . '/../.env');

// Configuration de la base de données
$dbHost = $_ENV['DATABASE_HOST'] ?? 'localhost';
$dbPort = $_ENV['DATABASE_PORT'] ?? '5432';
$dbName = $_ENV['DATABASE_NAME'] ?? 'dorevia';
$dbUser = $_ENV['DATABASE_USER'] ?? 'dorevia';
$dbPassword = $_ENV['DATABASE_PASSWORD'] ?? '';

try {
    $pdo = new PDO(
        "pgsql:host=$dbHost;port=$dbPort;dbname=$dbName",
        $dbUser,
        $dbPassword,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "✅ Connexion à la base de données réussie\n\n";

    // Récupérer tous les articles sans catégorie
    $stmt = $pdo->query("
        SELECT id, title, excerpt, content 
        FROM articles 
        WHERE category IS NULL OR category = ''
        ORDER BY id
    ");

    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($articles)) {
        echo "✅ Tous les articles ont déjà une catégorie.\n";
        exit(0);
    }

    echo sprintf("📝 Trouvé %d article(s) sans catégorie.\n\n", count($articles));

    // Mots-clés pour détecter la catégorie
    $keywords = [
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

    $defaultCategory = 'Conformité & réglementation';
    $stats = array_fill_keys(array_keys($keywords), 0);
    $updated = 0;

    echo "📊 Analyse et assignation des catégories...\n\n";

    foreach ($articles as $article) {
        $text = strtolower(
            ($article['title'] ?? '') . ' ' .
            ($article['excerpt'] ?? '') . ' ' .
            ($article['content'] ?? '')
        );

        $scores = [];
        foreach ($keywords as $category => $categoryKeywords) {
            $score = 0;
            foreach ($categoryKeywords as $keyword) {
                $score += substr_count($text, strtolower($keyword));
            }
            if ($score > 0) {
                $scores[$category] = $score;
            }
        }

        if (empty($scores)) {
            $category = $defaultCategory;
            $method = 'Par défaut';
        } else {
            arsort($scores);
            $category = array_key_first($scores);
            $method = 'Détection automatique';
        }

        // Mettre à jour l'article
        $updateStmt = $pdo->prepare("
            UPDATE articles 
            SET category = :category 
            WHERE id = :id
        ");

        $updateStmt->execute([
            'category' => $category,
            'id' => $article['id']
        ]);

        echo sprintf(
            "  ✓ [%d] %s → %s (%s)\n",
            $article['id'],
            substr($article['title'], 0, 50),
            $category,
            $method
        );

        $stats[$category]++;
        $updated++;
    }

    echo "\n✅ Mise à jour terminée : $updated article(s) mis à jour.\n\n";
    echo "📈 Statistiques par catégorie :\n";
    foreach ($stats as $category => $count) {
        if ($count > 0) {
            echo sprintf("  • %s : %d article(s)\n", $category, $count);
        }
    }

} catch (PDOException $e) {
    echo "❌ Erreur : " . $e->getMessage() . "\n";
    exit(1);
}
