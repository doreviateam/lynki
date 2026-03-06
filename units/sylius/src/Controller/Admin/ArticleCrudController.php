<?php

namespace App\Controller\Admin;

use App\Entity\Article;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Filter\ChoiceFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\DateTimeFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\TextFilter;

class ArticleCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Article::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Article')
            ->setEntityLabelInPlural('Articles')
            ->setPageTitle('index', 'Gestion des articles')
            ->setPageTitle('new', 'Créer un article')
            ->setPageTitle('edit', 'Modifier l\'article')
            ->setDefaultSort(['publishedAt' => 'DESC', 'createdAt' => 'DESC'])
            ->setSearchFields(['title', 'slug', 'author', 'content', 'excerpt']);
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters
            ->add(TextFilter::new('title'))
            ->add(TextFilter::new('author'))
            ->add(ChoiceFilter::new('status')
                ->setChoices([
                    'Brouillon' => 'draft',
                    'Publié' => 'published',
                    'Archivé' => 'archived',
                ]))
            ->add(DateTimeFilter::new('publishedAt'))
            ->add(DateTimeFilter::new('createdAt'))
            ->add(ChoiceFilter::new('category', 'Catégorie')
                ->setChoices([
                    'Conformité & réglementation' => 'Conformité & réglementation',
                    'ERP & Odoo CE' => 'ERP & Odoo CE',
                    'Trésorerie & pilotage' => 'Trésorerie & pilotage',
                    'Preuve & audit' => 'Preuve & audit',
                    'Architecture & sécurité' => 'Architecture & sécurité',
                ]));
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            IdField::new('id')->onlyOnIndex(),
            TextField::new('title', 'Titre')
                ->setRequired(true)
                ->setHelp('Titre de l\'article (max 255 caractères)'),
            TextField::new('slug', 'Slug')
                ->setRequired(true)
                ->setHelp('URL-friendly identifier (ex: mon-article)'),
            TextareaField::new('excerpt', 'Extrait')
                ->setHelp('Description courte affichée dans les listes')
                ->setNumOfRows(3),
            TextareaField::new('content', 'Contenu')
                ->setRequired(true)
                ->setHelp('Contenu de l\'article (Markdown ou HTML)')
                ->setNumOfRows(15)
                ->hideOnIndex(),
            TextField::new('author', 'Auteur')
                ->setRequired(true),
            ChoiceField::new('status', 'Statut')
                ->setChoices([
                    'Brouillon' => 'draft',
                    'Publié' => 'published',
                    'Archivé' => 'archived',
                ])
                ->setRequired(true),
            DateTimeField::new('publishedAt', 'Date de publication')
                ->setHelp('Date de publication (null = brouillon)')
                ->setFormat('dd/MM/yyyy HH:mm'),
            TextField::new('metaDescription', 'Meta Description')
                ->setHelp('Description pour le SEO (max 160 caractères recommandés)')
                ->hideOnIndex(),
            TextField::new('metaKeywords', 'Meta Keywords')
                ->setHelp('Mots-clés pour le SEO (séparés par des virgules)')
                ->hideOnIndex(),
            TextField::new('coverImage', 'Image de couverture')
                ->setHelp('URL ou chemin de l\'image de couverture')
                ->hideOnIndex(),
            ChoiceField::new('category', 'Catégorie')
                ->setRequired(true)
                ->setChoices([
                    'Conformité & réglementation' => 'Conformité & réglementation',
                    'ERP & Odoo CE' => 'ERP & Odoo CE',
                    'Trésorerie & pilotage' => 'Trésorerie & pilotage',
                    'Preuve & audit' => 'Preuve & audit',
                    'Architecture & sécurité' => 'Architecture & sécurité',
                ])
                ->setHelp('Catégorie thématique de l\'article (obligatoire)'),
            IntegerField::new('views', 'Vues')
                ->onlyOnIndex()
                ->setHelp('Nombre de vues'),
            DateTimeField::new('createdAt', 'Créé le')
                ->onlyOnIndex()
                ->setFormat('dd/MM/yyyy HH:mm'),
            DateTimeField::new('updatedAt', 'Modifié le')
                ->onlyOnIndex()
                ->setFormat('dd/MM/yyyy HH:mm'),
        ];
    }
}
