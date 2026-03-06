<?php

namespace App\Controller;

use App\Entity\Lead;
use App\Form\LeadType;
use App\Service\OdooLeadSyncService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Lead Controller
 * 
 * Traite la soumission du formulaire de capture de leads.
 */
class LeadController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private OdooLeadSyncService $odooLeadSyncService,
        private LoggerInterface $logger,
        private RateLimiterFactory $leadFormLimiter
    ) {
    }

    #[Route('/lead', name: 'lead_submit', methods: ['POST'])]
    public function submit(Request $request): Response
    {
        // Rate limiting : 10 requêtes/heure par IP
        $limiter = $this->leadFormLimiter->create($request->getClientIp());
        
        if (!$limiter->consume()->isAccepted()) {
            $this->logger->warning('Rate limit exceeded', [
                'ip' => $request->getClientIp(),
                'user_agent' => $request->headers->get('User-Agent'),
            ]);
            
            return $this->json([
                'status' => 'error',
                'message' => 'Trop de requêtes. Veuillez réessayer dans une heure.',
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $lead = new Lead();
        $form = $this->createForm(LeadType::class, $lead);
        $form->handleRequest($request);

        // Vérification honeypot (champ website)
        $websiteField = $request->request->get('lead')['website'] ?? null;
        if (!empty($websiteField)) {
            // Bot détecté : rejet silencieux
            $this->logger->warning('Honeypot triggered', [
                'ip' => $request->getClientIp(),
                'user_agent' => $request->headers->get('User-Agent'),
            ]);
            
            // Retourner 200 pour ne pas indiquer que c'est un rejet
            return $this->json([
                'status' => 'success',
                'message' => 'Merci pour votre demande. Nous vous contacterons sous peu.',
            ], Response::HTTP_OK);
        }

        if (!$form->isSubmitted()) {
            return $this->json([
                'status' => 'error',
                'message' => 'Formulaire non soumis',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!$form->isValid()) {
            // Retourner les erreurs de validation
            $errors = [];
            foreach ($form->getErrors(true) as $error) {
                $errors[] = $error->getMessage();
            }
            
            return $this->json([
                'status' => 'error',
                'message' => 'Erreurs de validation',
                'errors' => $errors,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Récupération des paramètres UTM depuis la requête
        $utmSource = $request->query->get('utm_source') ?? $request->request->get('utm_source');
        $utmCampaign = $request->query->get('utm_campaign') ?? $request->request->get('utm_campaign');
        $utmMedium = $request->query->get('utm_medium') ?? $request->request->get('utm_medium');
        $utmContent = $request->query->get('utm_content') ?? $request->request->get('utm_content');

        // Capture des métadonnées
        $ip = $request->getClientIp();
        $userAgent = $request->headers->get('User-Agent');
        $referrer = $request->headers->get('Referer');

        // Hash de l'IP (anonymisation RGPD)
        $ipHash = $ip ? hash('sha256', $ip . $_ENV['APP_SECRET'] ?? 'default_secret') : null;

        // Configuration du lead
        $lead->setUtmSource($utmSource);
        $lead->setUtmCampaign($utmCampaign);
        $lead->setUtmMedium($utmMedium);
        $lead->setUtmContent($utmContent);
        $lead->setReferrer($referrer);
        $lead->setIpHash($ipHash);
        $lead->setUserAgent($userAgent);
        // Status initial : 'new' (sera changé en 'pending' après sauvegarde)

        // Sauvegarde en base de données
        try {
            $this->entityManager->persist($lead);
            $this->entityManager->flush();

            // Marquer comme pending pour synchronisation Odoo
            $lead->setStatus('pending');
            $this->entityManager->flush();

            $this->logger->info('Lead créé avec succès', [
                'lead_id' => $lead->getId(),
                'public_uuid' => $lead->getPublicUuid(),
                'email' => $lead->getEmail(),
            ]);

            // Synchronisation Odoo (asynchrone, ne bloque pas)
            try {
                $this->odooLeadSyncService->syncLeadToOdoo($lead);
            } catch (\Exception $e) {
                // Log l'erreur mais ne bloque pas la réponse
                $this->logger->error('Erreur synchronisation Odoo', [
                    'lead_id' => $lead->getId(),
                    'error' => $e->getMessage(),
                ]);
            }

            // Réponse JSON de succès
            return $this->json([
                'status' => 'success',
                'message' => 'Merci pour votre demande. Nous vous contacterons sous peu.',
                'lead_uuid' => $lead->getPublicUuid(),
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la création du lead', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json([
                'status' => 'error',
                'message' => 'Une erreur est survenue. Veuillez réessayer plus tard.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
