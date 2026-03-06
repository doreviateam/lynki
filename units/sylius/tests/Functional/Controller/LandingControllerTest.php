<?php

namespace App\Tests\Functional\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class LandingControllerTest extends WebTestCase
{
    public function testLandingPageReturns200(): void
    {
        $client = static::createClient();
        $client->request('GET', '/');
        
        $this->assertResponseStatusCodeSame(200);
        $this->assertSelectorTextContains('h1', 'Dorevia-Vault');
    }
}
