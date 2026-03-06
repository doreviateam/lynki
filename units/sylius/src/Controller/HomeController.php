<?php

namespace App\Controller;

use App\Entity\Lead;
use App\Form\LeadType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Home Page Controller
 * 
 * Page d'accueil avec Hero, bénéfices clés et teaser pricing.
 * Détecte automatiquement le tenant via variable d'environnement.
 */
class HomeController extends AbstractController
{
    #[Route('/accueil', name: 'home')]
    #[Route('/', name: 'home_redirect')]
    public function index(): Response
    {
        // Détection du tenant via variable d'environnement
        $tenantId = $_ENV['TENANT_ID'] ?? 'core';
        
        if ($tenantId === 'lovable44') {
            // Tenant lovable44 : Afficher Lov'Arbitre
            return $this->render('lovable/lovarbitre.html.twig', [
                'page_title' => 'Lov\'Arbitre — Qui mérite le carton ?',
                'page_description' => 'Lov\'Arbitre transforme vos disputes de couple en match officiel : l\'IA siffle, repère les fautes, sort les cartons et affiche les stats. Fun, assumé, jamais méchant.',
                'tenant' => 'lovable44',
            ]);
        }
        
        // Formulaire Lead pour la landing V2
        $lead = new Lead();
        $form = $this->createForm(LeadType::class, $lead);
        
        // Tenant core (par défaut) : Afficher Dorevia-Vault
        return $this->render('home/index.html.twig', [
            'page_title' => 'Dorevia-Vault — Des chiffres vrais. Enfin.',
            'page_description' => 'Dorevia-Vault automatise la capture et le scellage de vos événements financiers pour produire des preuves opposables. Dispositif conçu pour la conformité LNE 2026 / NF525.',
            'form' => $form->createView(),
        ]);
    }
}
