<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Cas d'Usage Page Controller
 * 
 * Page dédiée aux cas d'usage de Dorevia-Vault.
 */
class CasUsageController extends AbstractController
{
    #[Route('/cas-usage', name: 'cas_usage')]
    public function index(): Response
    {
        return $this->render('cas-usage/index.html.twig', [
            'page_title' => 'Cas d\'usage — Dorevia-Vault',
            'page_description' => 'Découvrez les cas d\'usage concrets de Dorevia-Vault pour votre entreprise.',
        ]);
    }
}
