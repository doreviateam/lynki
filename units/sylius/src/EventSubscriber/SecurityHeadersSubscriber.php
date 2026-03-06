<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * EventSubscriber pour ajouter les headers de sécurité HTTP
 */
class SecurityHeadersSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => 'onKernelResponse',
        ];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        $response = $event->getResponse();

        // X-Content-Type-Options: Empêche le MIME-sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // X-Frame-Options: Empêche le clickjacking
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // X-XSS-Protection: Protection XSS (legacy, mais toujours utile)
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Referrer-Policy: Contrôle les informations de referrer
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions-Policy: Contrôle les fonctionnalités du navigateur
        $response->headers->set(
            'Permissions-Policy',
            'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
        );

        // Content-Security-Policy: Protection contre XSS et injection
        // Note: Ajustez selon vos besoins (CDN, scripts externes, etc.)
        $csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com",
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
            "img-src 'self' data: https:",
            "connect-src 'self' https://sylius.lab.core.doreviateam.com https://www.google-analytics.com https://www.googletagmanager.com https://wa.me",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
        ];
        $response->headers->set('Content-Security-Policy', implode('; ', $csp));

        // Strict-Transport-Security (HSTS): Force HTTPS
        // Note: Activez seulement en production avec HTTPS
        // $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

        // Cache headers pour les assets statiques
        if ($event->getRequest()->getPathInfo() !== '/') {
            // Cache pour les pages HTML (1 heure)
            if (str_contains($response->headers->get('Content-Type', ''), 'text/html')) {
                $response->headers->set('Cache-Control', 'public, max-age=3600, must-revalidate');
            }
        }
    }
}
