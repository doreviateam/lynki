<?php

namespace App\Controller;

use App\Entity\Lead;
use App\Form\LeadType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Contact Page Controller
 * 
 * Page de contact avec formulaire Early Adopter.
 */
class ContactController extends AbstractController
{
    #[Route('/contact', name: 'contact')]
    public function index(Request $request): Response
    {
        $lead = new Lead();
        $form = $this->createForm(LeadType::class, $lead);

        return $this->render('contact/index.html.twig', [
            'page_title' => 'Contact — Demander une démo Dorevia-Vault',
            'page_description' => 'Rejoignez les early adopters de Dorevia-Vault. Formulaire simple et rapide pour demander une démo ou obtenir plus d\'informations.',
            'form' => $form->createView(),
        ]);
    }
}
