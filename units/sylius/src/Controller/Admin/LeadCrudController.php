<?php

namespace App\Controller\Admin;

use App\Entity\Lead;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\ArrayField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\EmailField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Filter\ChoiceFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\DateTimeFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\TextFilter;

class LeadCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Lead::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Lead')
            ->setEntityLabelInPlural('Leads')
            ->setPageTitle('index', 'Liste des Leads')
            ->setPageTitle('detail', 'Détail du Lead')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setPaginatorPageSize(50);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnIndex();
        yield TextField::new('publicUuid', 'UUID Public')
            ->onlyOnDetail()
            ->setHelp('Identifiant unique public du lead');
        yield EmailField::new('email', 'Email')
            ->setRequired(true);
        yield TextField::new('role', 'Rôle')
            ->setHelp('Rôle de la personne (dirigeant, DAF, comptable, etc.)');
        yield TextField::new('stack', 'Stack technique')
            ->hideOnIndex()
            ->setHelp('Stack technique utilisée (Odoo, ERP custom, etc.)');
        yield TextareaField::new('volume', 'Volume')
            ->hideOnIndex()
            ->setHelp('Volume de factures estimé');
        yield TextareaField::new('message', 'Message')
            ->hideOnIndex();
        yield TextField::new('status', 'Statut')
            ->setHelp('Statut du lead (new, pending, contacted, converted, etc.)');
        yield TextField::new('utmSource', 'UTM Source')
            ->hideOnIndex();
        yield TextField::new('utmCampaign', 'UTM Campaign')
            ->hideOnIndex();
        yield TextField::new('utmMedium', 'UTM Medium')
            ->hideOnIndex();
        yield TextField::new('utmContent', 'UTM Content')
            ->hideOnIndex();
        yield TextareaField::new('referrer', 'Referrer')
            ->hideOnIndex();
        yield TextField::new('ipHash', 'IP Hash')
            ->onlyOnDetail()
            ->setHelp('Hash SHA256 de l\'IP (anonymisé RGPD)');
        yield TextareaField::new('userAgent', 'User Agent')
            ->onlyOnDetail();
        yield IntegerField::new('odooLeadId', 'ID Lead Odoo')
            ->onlyOnDetail();
        yield TextField::new('odooSyncStatus', 'Statut Sync Odoo')
            ->setHelp('Statut de synchronisation avec Odoo');
        yield DateTimeField::new('odooSyncedAt', 'Synchronisé le')
            ->onlyOnDetail();
        yield DateTimeField::new('createdAt', 'Créé le')
            ->setFormat('dd/MM/yyyy HH:mm')
            ->setTimezone('Europe/Paris');
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters
            ->add(TextFilter::new('email'))
            ->add(ChoiceFilter::new('role')
                ->setChoices([
                    'dirigeant' => 'dirigeant',
                    'daf' => 'daf',
                    'comptable' => 'comptable',
                    'cabinet' => 'cabinet',
                    'retail' => 'retail',
                    'it_integrateur' => 'it_integrateur',
                    'autre' => 'autre',
                ]))
            ->add(ChoiceFilter::new('status')
                ->setChoices([
                    'new' => 'new',
                    'pending' => 'pending',
                    'contacted' => 'contacted',
                    'converted' => 'converted',
                    'rejected' => 'rejected',
                ]))
            ->add(ChoiceFilter::new('odooSyncStatus')
                ->setChoices([
                    'pending' => 'pending',
                    'synced' => 'synced',
                    'failed' => 'failed',
                ]))
            ->add(DateTimeFilter::new('createdAt'));
    }
}
