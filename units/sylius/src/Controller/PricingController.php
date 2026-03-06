<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Pricing API Controller
 * 
 * Expose les plans de pricing Dorevia-Vault via une API JSON.
 */
class PricingController extends AbstractController
{
    #[Route('/api/pricing/plans', name: 'api_pricing_plans', methods: ['GET'])]
    public function getPlans(): JsonResponse
    {
        $plans = [
            [
                'id' => 'starter',
                'name' => 'STARTER',
                'price' => 30.0,
                'currency' => 'EUR',
                'period' => 'month',
                'badge' => '⭐ Le plus choisi',
                'included_invoices' => 500,
                'overage_price' => 0.15,
                'target' => 'Artisans, TPE, commerçants, indépendants',
                'tagline' => 'Le prix d\'un TPE, pour sécuriser toute votre comptabilité.',
                'promise' => 'Sécurisez votre activité pour le prix d\'un café par jour.',
                'features' => [
                    'Jusqu\'à 500 factures / mois',
                    'Preuve cryptographique certifiée',
                    'Ledger immuable',
                    'Horodatage légal',
                    'Support email',
                    'API basique',
                    'Portail de consultation des preuves',
                ],
                'comparison' => 'Comparable au prix d\'une location de TPE',
            ],
            [
                'id' => 'business',
                'name' => 'BUSINESS',
                'price' => 80.0,
                'currency' => 'EUR',
                'period' => 'month',
                'badge' => '👍 Recommandé',
                'included_invoices' => 1500,
                'overage_price' => 0.12,
                'target' => 'PME, structures en croissance',
                'tagline' => 'Passez au niveau pro.',
                'promise' => 'Automatisez votre conformité, gagnez du temps, dormez tranquille.',
                'features' => [
                    'Jusqu\'à 1500 factures / mois',
                    'Tout Starter',
                    'Réconciliation automatique',
                    'Support prioritaire',
                    'API avancée',
                    'Exports comptables',
                    'Tableaux de suivi',
                ],
            ],
            [
                'id' => 'scale',
                'name' => 'SCALE',
                'price' => 150.0,
                'currency' => 'EUR',
                'period' => 'month',
                'badge' => '🚀 Pour les équipes',
                'included_invoices' => 5000,
                'overage_price' => 0.10,
                'target' => 'Entreprises structurées, groupes',
                'tagline' => 'Structurez votre croissance.',
                'promise' => 'Votre conformité devient un avantage stratégique.',
                'features' => [
                    'Jusqu\'à 5000 factures / mois',
                    'Tout Business',
                    'Reporting avancé',
                    'Support dédié',
                    'Formation incluse',
                    'SLA (99,9% - réponse < 24h)',
                    'Accès fonctionnalités bêta',
                ],
                'enterprise_note' => '+5000 factures → Offre Enterprise sur devis',
            ],
        ];

        $legal_mentions = [
            'Sans engagement',
            'Facturation mensuelle',
            'Annulation à tout moment',
            'Pas de frais cachés',
            'Upgrade / downgrade libre',
            'Paiement CB / virement',
        ];

        $early_adopter_info = [
            'message' => 'Les clients ayant souscrit à l\'ancienne offre Early (49 €) sont automatiquement migrés vers STARTER à 30 €.',
            'badge_text' => 'Tarif early adopter jusqu\'au 31/03/2026',
            'migration_date' => '2026-01-17',
        ];

        return $this->json([
            'plans' => $plans,
            'legal_mentions' => $legal_mentions,
            'early_adopter' => $early_adopter_info,
            'version' => '1.1',
            'updated_at' => '2026-01-17',
        ]);
    }

    #[Route('/api/pricing/calculate', name: 'api_pricing_calculate', methods: ['POST'])]
    public function calculatePrice(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['plan']) || !isset($data['invoices'])) {
            return $this->json([
                'status' => 'error',
                'message' => 'Paramètres manquants : plan et invoices requis',
            ], 400);
        }

        $planId = $data['plan'];
        $invoices = (int) $data['invoices'];

        if ($invoices < 0) {
            return $this->json([
                'status' => 'error',
                'message' => 'Le nombre de factures doit être positif',
            ], 400);
        }

        // Définition des plans
        $plans = [
            'starter' => [
                'base_price' => 30.0,
                'included_invoices' => 500,
                'overage_price' => 0.15,
            ],
            'business' => [
                'base_price' => 80.0,
                'included_invoices' => 1500,
                'overage_price' => 0.12,
            ],
            'scale' => [
                'base_price' => 150.0,
                'included_invoices' => 5000,
                'overage_price' => 0.10,
            ],
        ];

        if (!isset($plans[$planId])) {
            return $this->json([
                'status' => 'error',
                'message' => 'Plan invalide. Plans disponibles : starter, business, scale',
            ], 400);
        }

        $plan = $plans[$planId];
        $basePrice = $plan['base_price'];
        $includedInvoices = $plan['included_invoices'];
        $overagePrice = $plan['overage_price'];

        // Calcul
        $overageInvoices = max(0, $invoices - $includedInvoices);
        $overageTotal = $overageInvoices * $overagePrice;
        $total = $basePrice + $overageTotal;

        // Recommandation de plan si dépassement important
        $recommendation = null;
        if ($invoices > $includedInvoices * 1.5) {
            if ($planId === 'starter' && $invoices > 1000) {
                $recommendation = 'business';
            } elseif ($planId === 'business' && $invoices > 3000) {
                $recommendation = 'scale';
            }
        }

        return $this->json([
            'status' => 'success',
            'plan' => $planId,
            'invoices' => $invoices,
            'calculation' => [
                'base_price' => $basePrice,
                'included_invoices' => $includedInvoices,
                'used_invoices' => min($invoices, $includedInvoices),
                'overage_invoices' => $overageInvoices,
                'overage_price' => $overagePrice,
                'overage_total' => round($overageTotal, 2),
                'total' => round($total, 2),
            ],
            'recommendation' => $recommendation,
        ]);
    }
}
