<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Ressources Page Controller
 * 
 * Page présentant l'écosystème Dorevia-Vault : modules, API, documentation.
 */
class RessourcesController extends AbstractController
{
    #[Route('/ressources', name: 'ressources')]
    public function index(): Response
    {
        return $this->render('ressources/index.html.twig', [
            'page_title' => 'Ressources Dorevia-Vault — Modules, API et documentation',
            'page_description' => 'Modules, API et documentation pour sécuriser vos flux financiers. Dorevia-Vault s\'intègre naturellement avec Odoo Community Edition et tout ERP ouvert.',
        ]);
    }
}
