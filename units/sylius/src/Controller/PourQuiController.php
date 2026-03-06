<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Pour Qui Page Controller
 * 
 * Page dédiée aux personas cibles de Dorevia-Vault.
 */
class PourQuiController extends AbstractController
{
    #[Route('/pour-qui', name: 'pour_qui')]
    public function index(): Response
    {
        return $this->render('pour-qui/index.html.twig', [
            'page_title' => 'Pour qui — Dorevia-Vault',
            'page_description' => 'Dorevia-Vault s\'adresse aux CFO, dirigeants et entreprises soucieuses de la conformité financière.',
        ]);
    }
}
