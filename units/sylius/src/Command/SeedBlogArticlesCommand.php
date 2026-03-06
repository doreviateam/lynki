<?php

namespace App\Command;

use App\Entity\Article;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\String\Slugger\SluggerInterface;

#[AsCommand(
    name: 'app:seed-blog-articles',
    description: 'Crée les 3 articles fondateurs du blog Dorevia-Vault',
)]
class SeedBlogArticlesCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private SluggerInterface $slugger
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $articles = [
            [
                'title' => 'Pourquoi sécuriser vos factures avec Dorevia-Vault ?',
                'slug' => 'pourquoi-securiser-factures-dorevia-vault',
                'coverImage' => 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=600&fit=crop&q=80',
                'content' => <<<'MARKDOWN'
# Pourquoi sécuriser vos factures avec Dorevia-Vault ?

La conformité fiscale est un enjeu majeur pour toutes les entreprises, quelle que soit leur taille. Dorevia-Vault vous permet de sécuriser automatiquement vos factures et de générer des preuves cryptographiques opposables.

## Les enjeux de la conformité fiscale

En France, les entreprises doivent conserver leurs documents comptables pendant **10 ans**. Cette obligation légale s'accompagne de risques :

- **Contrôles fiscaux** : L'administration peut demander à vérifier vos documents à tout moment
- **Litiges commerciaux** : En cas de conflit, vous devez pouvoir prouver l'existence et l'intégrité de vos factures
- **Audits** : Les audits comptables nécessitent une traçabilité complète

## La solution Dorevia-Vault

Dorevia-Vault génère automatiquement des **preuves cryptographiques** pour chaque facture validée dans votre ERP :

1. **Hash SHA-256** : Empreinte digitale unique de chaque document
2. **Signature JWS** : Scellement cryptographique opposable
3. **Ledger immuable** : Registre de traçabilité infalsifiable
4. **Horodatage certifié** : Preuve d'antériorité conforme aux exigences légales

## Avantages concrets

✅ **Conformité garantie** : Vos documents sont conformes aux exigences fiscales françaises et européennes  
✅ **Preuve opposable** : Les preuves cryptographiques sont acceptées en contrôle fiscal  
✅ **Automatisation** : Aucune intervention manuelle nécessaire  
✅ **Souveraineté** : Hébergement France/UE, indépendance GAFAM

## Conclusion

Sécuriser vos factures avec Dorevia-Vault, c'est garantir votre conformité et dormir tranquille. Pour le prix d'un café par jour, protégez toute votre comptabilité.

[Demander une démo]({{ path('contact') }})
MARKDOWN,
                'excerpt' => 'Découvrez pourquoi la sécurisation cryptographique de vos factures est essentielle pour votre conformité fiscale et comment Dorevia-Vault vous protège automatiquement.',
                'author' => 'Équipe Dorevia',
                'metaDescription' => 'Découvrez pourquoi sécuriser vos factures avec Dorevia-Vault est essentiel pour votre conformité fiscale. Preuves cryptographiques opposables, automatisation complète.',
                'metaKeywords' => 'sécurisation factures, conformité fiscale, preuve cryptographique, archivage légal, Dorevia-Vault',
                'publishedAt' => new \DateTimeImmutable('2026-01-15 10:00:00'),
            ],
            [
                'title' => 'La règle des 3V : Validé, Vaulté, Vérifiable',
                'slug' => 'regle-3v-valide-vault-verifiable',
                'coverImage' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&q=80',
                'content' => <<<'MARKDOWN'
# La règle des 3V : Validé, Vaulté, Vérifiable

Dorevia-Vault fonctionne selon une règle simple et puissante : la **règle des 3V**. Cette approche garantit la traçabilité complète de vos documents financiers.

## Validé : Le document atteint un état juridiquement engageant

Dans votre ERP (Odoo ou autre), une facture est **validée** lorsqu'elle atteint un état juridiquement engageant :

- Facture client **postée** (comptabilisée)
- Facture fournisseur **validée**
- Avoir **émis**
- Ticket POS **finalisé**

Dès cet instant, Dorevia-Vault intervient automatiquement.

## Vaulté : Hashé, signé, inscrit dans le ledger

Une fois validée, la facture est immédiatement :

1. **Hashée** avec SHA-256 : Une empreinte digitale unique est calculée
2. **Signée** avec JWS (JSON Web Signature) : Scellement cryptographique opposable
3. **Inscrite** dans le ledger : Registre immuable hash-chaîné

Cette étape garantit l'**intégrité** et la **traçabilité** du document.

## Vérifiable : Preuve indépendamment vérifiable

La preuve générée par Dorevia-Vault est **indépendamment vérifiable** :

- **JWKS public** : Les clés de vérification sont publiques
- **Export ledger** : Le registre peut être exporté en JSON/CSV
- **API de vérification** : Endpoint `/api/v1/ledger/verify/:id` pour vérifier l'intégrité
- **Horodatage TSA** : Option d'horodatage certifié (eIDAS compatible)

N'importe qui peut vérifier qu'un document n'a pas été modifié, sans dépendre de Dorevia-Vault.

## Exemple concret

Imaginons une facture de 1000€ validée le 15 janvier 2026 :

1. **Validé** : Facture postée dans Odoo à 14h30
2. **Vaulté** : Dorevia-Vault génère la preuve à 14h30:01
   - Hash SHA-256 : `a1b2c3d4...`
   - Signature JWS : `eyJhbGciOiJSUzI1NiIs...`
   - Ledger hash : `prev_hash + current_hash`
3. **Vérifiable** : Le contrôleur fiscal peut vérifier l'intégrité via l'API publique

## Avantages de la règle des 3V

✅ **Simplicité** : Processus clair et compréhensible  
✅ **Traçabilité** : Chaque étape est enregistrée  
✅ **Vérifiabilité** : Preuve indépendante de Dorevia-Vault  
✅ **Conformité** : Répond aux exigences fiscales et réglementaires

## Conclusion

La règle des 3V est au cœur de Dorevia-Vault. Elle garantit que chaque document validé dans votre ERP devient automatiquement une preuve cryptographique opposable.

[En savoir plus sur Dorevia-Vault]({{ path('features') }})
MARKDOWN,
                'excerpt' => 'Découvrez la règle des 3V qui garantit la traçabilité complète de vos documents : Validé dans votre ERP, Vaulté avec preuve cryptographique, Vérifiable indépendamment.',
                'author' => 'Équipe Dorevia',
                'metaDescription' => 'La règle des 3V de Dorevia-Vault : Validé, Vaulté, Vérifiable. Comprenez comment vos factures deviennent des preuves cryptographiques opposables.',
                'metaKeywords' => 'règle 3V, preuve cryptographique, traçabilité, vérification indépendante, Dorevia-Vault',
                'publishedAt' => new \DateTimeImmutable('2026-01-16 10:00:00'),
            ],
            [
                'title' => 'Intégration Dorevia-Vault avec Odoo : Guide pratique',
                'slug' => 'integration-dorevia-vault-odoo-guide',
                'content' => <<<'MARKDOWN'
# Intégration Dorevia-Vault avec Odoo : Guide pratique

Dorevia-Vault s'intègre nativement avec Odoo via le module **dorevia_vault_connector**. Ce guide vous explique comment configurer l'intégration en quelques minutes.

## Prérequis

- Odoo CE 18 ou supérieur
- Module `dorevia_vault_connector` installé
- Compte Dorevia-Vault actif
- URL de l'API Vault (fournie lors de l'inscription)

## Installation du module

### Via l'interface Odoo

1. Allez dans **Applications** > **Mettre à jour la liste des applications**
2. Recherchez "Dorevia Vault Connector"
3. Cliquez sur **Installer**

### Via ligne de commande

```bash
odoo-bin -c odoo.conf -u dorevia_vault_connector -d votre_base
```

## Configuration

### 1. Paramètres système

Allez dans **Paramètres** > **Technique** > **Paramètres système** et configurez :

- `dorevia_vault.url` : URL de l'API Vault (ex: `https://vault.lab.core.doreviateam.com`)
- `dorevia_vault.api_key` : Clé API (fournie dans votre espace client)
- `dorevia_vault.tenant` : Identifiant de votre tenant

### 2. Activation par modèle

Activez la vaultérisation pour les modèles souhaités :

- **Factures clients** (`account.move` type `out_invoice`)
- **Factures fournisseurs** (`account.move` type `in_invoice`)
- **Avoirs** (`account.move` type `out_refund` / `in_refund`)
- **Tickets POS** (`pos.order`)

## Fonctionnement automatique

Une fois configuré, Dorevia-Vault intervient **automatiquement** :

1. Lorsqu'une facture est **postée** (comptabilisée), un webhook est envoyé à DVIG
2. DVIG (Dorevia Ingest Gateway) transforme l'événement en appel API Vault
3. Le Vault génère la preuve cryptographique (hash, JWS, ledger)
4. La preuve est stockée et accessible via l'API

## Vérification

### Dans Odoo

Chaque facture vaultée affiche :

- ✅ Badge "Vaulté" dans la vue formulaire
- 🔗 Lien vers la preuve dans le chatter
- 📄 Export de la preuve en PDF

### Via l'API Vault

Vous pouvez vérifier une preuve via :

```bash
curl https://vault.lab.core.doreviateam.com/api/v1/proof/account_move/12345
```

## Dépannage

### La facture n'est pas vaultée

1. Vérifiez que le module est bien installé et activé
2. Vérifiez les paramètres système (URL, API key, tenant)
3. Consultez les logs Odoo : `tail -f /var/log/odoo/odoo.log | grep vault`
4. Vérifiez la connectivité réseau vers l'API Vault

### Erreur de synchronisation

1. Vérifiez que l'API key est valide
2. Vérifiez que le tenant correspond à votre compte
3. Contactez le support Dorevia-Vault si le problème persiste

## Support

Pour toute question sur l'intégration :

- 📧 Email : support@doreviateam.com
- 📚 Documentation : [docs.doreviateam.com](https://docs.doreviateam.com)
- 💬 Chat : Disponible dans votre espace client

[Demander de l'aide]({{ path('contact') }})
MARKDOWN,
                'excerpt' => 'Guide pratique pour intégrer Dorevia-Vault avec Odoo. Installation, configuration, et vérification en quelques minutes.',
                'author' => 'Équipe Dorevia',
                'metaDescription' => 'Guide complet pour intégrer Dorevia-Vault avec Odoo. Installation du module, configuration, et vérification de la vaultérisation automatique.',
                'metaKeywords' => 'intégration Odoo, Dorevia-Vault, module Odoo, configuration, guide pratique',
                'publishedAt' => new \DateTimeImmutable('2026-01-17 10:00:00'),
            ],
        ];

        $io->progressStart(count($articles));

        foreach ($articles as $articleData) {
            // Vérifier si l'article existe déjà
            $existing = $this->entityManager->getRepository(Article::class)->findOneBy(['slug' => $articleData['slug']]);
            
            if ($existing) {
                $io->note(sprintf('Article "%s" existe déjà, ignoré.', $articleData['title']));
                $io->progressAdvance();
                continue;
            }

            $article = new Article();
            $article->setTitle($articleData['title']);
            $article->setSlug($articleData['slug']);
            $article->setContent($articleData['content']);
            $article->setExcerpt($articleData['excerpt']);
            $article->setAuthor($articleData['author']);
            $article->setMetaDescription($articleData['metaDescription']);
            $article->setMetaKeywords($articleData['metaKeywords']);
            $article->setPublishedAt($articleData['publishedAt']);
            $article->setStatus('published');
            if (isset($articleData['coverImage'])) {
                $article->setCoverImage($articleData['coverImage']);
            }

            $this->entityManager->persist($article);
            $io->progressAdvance();
        }

        $this->entityManager->flush();
        $io->progressFinish();

        $io->success(sprintf('✅ %d articles créés avec succès !', count($articles)));

        return Command::SUCCESS;
    }
}
