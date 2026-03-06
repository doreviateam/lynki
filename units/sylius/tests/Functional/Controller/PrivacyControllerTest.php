<?php

namespace App\Tests\Functional\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class PrivacyControllerTest extends WebTestCase
{
    public function testPrivacyPageReturns200(): void
    {
        $client = static::createClient();
        $client->request('GET', '/privacy');
        
        $this->assertResponseStatusCodeSame(200);
        $this->assertSelectorTextContains('h1', 'Politique de Confidentialité');
    }
}
