<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Features Page Controller
 * 
 * Page détaillant les fonctionnalités de Dorevia-Vault.
 */
class FeaturesController extends AbstractController
{
    // #[Route('/fonctionnalites', name: 'features')] // Désactivé - one-page uniquement
    public function index(): Response
    {
        return $this->render('features/index.html.twig', [
            'page_title' => 'Fonctionnalités — Dorevia-Vault',
            'page_description' => 'Découvrez toutes les fonctionnalités de Dorevia-Vault : capture automatique, ledger immuable, horodatage certifié, auditabilité, sécurité souveraine.',
        ]);
    }
}
