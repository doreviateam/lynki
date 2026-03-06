<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Conformité Page Controller
 * 
 * Page dédiée à la conformité réglementaire (LNE 2026 / NF525).
 */
class ConformiteController extends AbstractController
{
    #[Route('/conformite', name: 'conformite')]
    public function index(): Response
    {
        return $this->render('conformite/index.html.twig', [
            'page_title' => 'Conformité — Dorevia-Vault',
            'page_description' => 'Dorevia-Vault conforme aux exigences LNE 2026 / NF525 pour la preuve financière.',
        ]);
    }
}
