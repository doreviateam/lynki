<?php
require_once __DIR__ . "/../vendor/autoload.php";
$dotenv = new Symfony\Component\Dotenv\Dotenv();
$dotenv->load(__DIR__ . "/../.env");
$kernel = new App\Kernel($_ENV["APP_ENV"] ?? "dev", (bool)($_ENV["APP_DEBUG"] ?? false));
$kernel->boot();
$em = $kernel->getContainer()->get("doctrine.orm.entity_manager");
$articles = $em->getRepository(App\Entity\Article::class)->createQueryBuilder("a")->where("a.category IS NULL OR a.category = :empty")->setParameter("empty", "")->getQuery()->getResult();
if (empty($articles)) { echo "Tous les articles ont une catégorie\n"; exit(0); }
echo "Trouvé " . count($articles) . " article(s) sans catégorie\n\n";
$keywords = ["Conformité & réglementation" => ["conformité", "nf525", "lne", "fiscal"], "ERP & Odoo CE" => ["odoo", "erp", "intégration", "module"], "Trésorerie & pilotage" => ["trésorerie", "pilotage", "finance"], "Preuve & audit" => ["preuve", "audit", "vérification"], "Architecture & sécurité" => ["architecture", "sécurité", "api"]];
$stats = array_fill_keys(array_keys($keywords), 0);
foreach ($articles as $a) {
  $text = strtolower(($a->getTitle() ?? "") . " " . ($a->getExcerpt() ?? "") . " " . ($a->getContent() ?? ""));
  $scores = [];
  foreach ($keywords as $cat => $kws) {
    $score = 0;
    foreach ($kws as $kw) $score += substr_count($text, $kw);
    if ($score > 0) $scores[$cat] = $score;
  }
  $cat = empty($scores) ? "Conformité & réglementation" : array_key_first($scores);
  $a->setCategory($cat);
  echo "✓ " . substr($a->getTitle(), 0, 60) . " → " . $cat . "\n";
  $stats[$cat]++;
}
$em->flush();
echo "\nTerminé: " . count($articles) . " article(s) mis à jour\n";
