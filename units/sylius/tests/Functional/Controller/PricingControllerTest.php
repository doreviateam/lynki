<?php

namespace App\Tests\Functional\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class PricingControllerTest extends WebTestCase
{
    public function testPricingPlansApi(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/pricing/plans');

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('Content-Type', 'application/json');

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
        $this->assertArrayHasKey('plans', $data);
        $this->assertCount(3, $data['plans']); // STARTER, BUSINESS, SCALE

        // Vérifier la structure d'un plan
        $starter = $data['plans'][0];
        $this->assertArrayHasKey('id', $starter);
        $this->assertArrayHasKey('name', $starter);
        $this->assertArrayHasKey('price', $starter);
        $this->assertArrayHasKey('included_invoices', $starter);
    }

    public function testPricingCalculateApiSuccess(): void
    {
        $client = static::createClient();
        $client->request(
            'POST',
            '/api/pricing/calculate',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'plan' => 'starter',
                'invoices' => 750,
            ])
        );

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('Content-Type', 'application/json');

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('status', $data);
        $this->assertEquals('success', $data['status']);
        $this->assertArrayHasKey('calculation', $data);
        $this->assertEquals(67.5, $data['calculation']['total']); // 30 + (250 * 0.15)
    }

    public function testPricingCalculateApiMissingParameters(): void
    {
        $client = static::createClient();
        $client->request(
            'POST',
            '/api/pricing/calculate',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['plan' => 'starter'])
        );

        $this->assertResponseStatusCodeSame(400);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals('error', $data['status']);
    }

    public function testPricingCalculateApiInvalidPlan(): void
    {
        $client = static::createClient();
        $client->request(
            'POST',
            '/api/pricing/calculate',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'plan' => 'invalid',
                'invoices' => 100,
            ])
        );

        $this->assertResponseStatusCodeSame(400);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals('error', $data['status']);
    }

    public function testPricingCalculateApiNegativeInvoices(): void
    {
        $client = static::createClient();
        $client->request(
            'POST',
            '/api/pricing/calculate',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'plan' => 'starter',
                'invoices' => -10,
            ])
        );

        $this->assertResponseStatusCodeSame(400);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals('error', $data['status']);
    }

    public function testPricingCalculateAllPlans(): void
    {
        $client = static::createClient();
        $plans = ['starter', 'business', 'scale'];

        foreach ($plans as $plan) {
            $client->request(
                'POST',
                '/api/pricing/calculate',
                [],
                [],
                ['CONTENT_TYPE' => 'application/json'],
                json_encode([
                    'plan' => $plan,
                    'invoices' => 1000,
                ])
            );

            $this->assertResponseIsSuccessful();
            $data = json_decode($client->getResponse()->getContent(), true);
            $this->assertEquals('success', $data['status']);
            $this->assertArrayHasKey('calculation', $data);
            $this->assertGreaterThan(0, $data['calculation']['total']);
        }
    }

    public function testPricingPageRenders(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/tarifs');

        $this->assertResponseIsSuccessful();
        $this->assertSelectorTextContains('h2', 'Modèle MRR transparent');
    }
}
