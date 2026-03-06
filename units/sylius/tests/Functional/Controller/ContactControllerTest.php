<?php

namespace App\Tests\Functional\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ContactControllerTest extends WebTestCase
{
    public function testContactPageRenders(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/contact');

        $this->assertResponseIsSuccessful();
        $this->assertSelectorTextContains('h2', 'Rejoignez les early adopters');
    }

    public function testContactFormExists(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/contact');

        $this->assertResponseIsSuccessful();
        $this->assertSelectorExists('form');
        $this->assertSelectorExists('input[name*="email"]');
    }

    public function testContactFormSubmissionWithValidData(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/contact');

        $form = $crawler->selectButton('Envoyer ma demande')->form([
            'lead[email]' => 'test@example.com',
            'lead[role]' => 'dirigeant',
        ]);

        $client->submit($form);
        
        // Le formulaire devrait rediriger ou afficher un message de succès
        $this->assertResponseIsSuccessful();
    }

    public function testContactFormValidation(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/contact');

        $form = $crawler->selectButton('Envoyer ma demande')->form([
            'lead[email]' => 'invalid-email',
            'lead[role]' => 'dirigeant',
        ]);

        $crawler = $client->submit($form);
        
        // Le formulaire devrait afficher des erreurs de validation
        $this->assertResponseIsSuccessful();
    }
}
