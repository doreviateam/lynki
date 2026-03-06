<?php

namespace App\Tests\Functional\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class HealthControllerTest extends WebTestCase
{
    public function testHealthzReturns200(): void
    {
        $client = static::createClient();
        $client->request('GET', '/healthz');
        
        $this->assertResponseStatusCodeSame(200);
        
        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals('healthy', $response['status']);
        $this->assertEquals('dorevia-vault-landing', $response['service']);
    }
}
