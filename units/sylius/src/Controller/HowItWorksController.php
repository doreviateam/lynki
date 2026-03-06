<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * How It Works Page Controller
 * 
 * Page expliquant le fonctionnement de Dorevia-Vault en 3 étapes.
 */
class HowItWorksController extends AbstractController
{
    // #[Route('/comment-ca-marche', name: 'how_it_works')] // Désactivé - one-page uniquement
    public function index(): Response
    {
        return $this->render('how-it-works/index.html.twig', [
            'page_title' => 'Comment ça marche ? — Dorevia-Vault',
            'page_description' => 'Découvrez comment Dorevia-Vault sécurise automatiquement vos factures en 3 étapes simples. Zéro changement d\'habitudes, preuve légale garantie.',
        ]);
    }
}
