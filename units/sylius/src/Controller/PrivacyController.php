<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Privacy Controller
 * 
 * Affiche la page de politique de confidentialité (RGPD).
 */
class PrivacyController extends AbstractController
{
    #[Route('/privacy', name: 'privacy_index', methods: ['GET'])]
    public function index(): Response
    {
        return $this->render('privacy/index.html.twig', [
            'page_title' => 'Politique de Confidentialité — Dorevia-Vault',
            'page_description' => 'Politique de confidentialité et protection des données personnelles.',
        ]);
    }
}
