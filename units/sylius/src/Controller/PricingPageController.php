<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Pricing Page Controller
 * 
 * Page dédiée aux tarifs avec grille complète et calculateur.
 */
class PricingPageController extends AbstractController
{
    // #[Route('/tarifs', name: 'pricing')] // Désactivé - one-page uniquement
    public function index(): Response
    {
        return $this->render('pricing/index.html.twig', [
            'page_title' => 'Tarifs — Dorevia-Vault',
            'page_description' => 'Découvrez nos offres STARTER (30€), BUSINESS (80€) et SCALE (150€). Comparez les tarifs et calculez votre coût mensuel.',
        ]);
    }
}
