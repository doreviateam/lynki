<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Lovable Controller
 * 
 * Contrôleur pour les projets Lovable (Lov'Arbitre, etc.)
 */
class LovableController extends AbstractController
{
    /**
     * Page Lov'Arbitre — Landing page one-page
     * 
     * Tenant: lovable44 / lovable2026
     * Site standalone avec design jaune/noir, démo interactive
     */
    #[Route('/lovarbitre', name: 'lovable_lovarbitre')]
    public function lovarbitre(): Response
    {
        return $this->render('lovable/lovarbitre.html.twig', [
            'page_title' => 'Lov\'Arbitre — Qui mérite le carton ?',
            'page_description' => 'Lov\'Arbitre transforme vos disputes de couple en match officiel : l\'IA siffle, repère les fautes, sort les cartons et affiche les stats. Fun, assumé, jamais méchant.',
            'tenant' => 'lovable44',
        ]);
    }
}
