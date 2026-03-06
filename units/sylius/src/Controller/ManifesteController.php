<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Manifeste Page Controller
 * 
 * Page dédiée au manifeste complet de Dorevia-Vault.
 */
class ManifesteController extends AbstractController
{
    #[Route('/manifeste', name: 'manifeste')]
    public function index(): Response
    {
        return $this->render('manifeste/index.html.twig', [
            'page_title' => 'Manifeste — Dorevia-Vault',
            'page_description' => 'Pourquoi Dorevia-Vault existe. Notre vision pour une infrastructure de vérité financière.',
        ]);
    }
}
