<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Health Check Controller
 * 
 * Endpoint de health check pour monitoring et load balancers.
 */
class HealthController extends AbstractController
{
    #[Route('/healthz', name: 'health_check', methods: ['GET'])]
    public function healthz(): JsonResponse
    {
        // Vérifications de base (à enrichir selon besoins)
        $status = [
            'status' => 'healthy',
            'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            'service' => 'dorevia-vault-landing',
            'version' => '1.2',
        ];

        return new JsonResponse($status, Response::HTTP_OK);
    }
}
