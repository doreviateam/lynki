<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Landing Page Controller
 * 
 * @deprecated Ce contrôleur est obsolète. Utiliser HomeController::index() à la place.
 * Conservé pour compatibilité avec d'éventuelles références externes.
 * 
 * La route /landing redirige vers /accueil (HomeController).
 */
class LandingController extends AbstractController
{
    /**
     * Redirection vers la page d'accueil
     * 
     * @deprecated Utiliser HomeController::index() à la place
     */
    #[Route('/landing', name: 'landing_index', methods: ['GET'])]
    public function index(): Response
    {
        return $this->redirectToRoute('home', [], 301);
    }
}
