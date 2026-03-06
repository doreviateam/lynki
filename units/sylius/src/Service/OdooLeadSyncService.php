<?php

namespace App\Service;

use App\Entity\Lead;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

/**
 * Service de synchronisation des leads vers Odoo CRM
 * 
 * Synchronise automatiquement les leads créés dans Sylius vers Odoo CRM (crm.lead).
 * Gère la création automatique des sources et campagnes marketing si absentes.
 */
class OdooLeadSyncService
{
    private ?string $odooUrl;
    private ?string $odooDb;
    private ?string $odooUser;
    private ?string $odooPassword;
    private ?int $odooTeamId;
    private ?int $odooUserId;

    public function __construct(
        private EntityManagerInterface $entityManager,
        private LoggerInterface $logger,
        ParameterBagInterface $params
    ) {
        $this->odooUrl = $_ENV['ODOO_URL'] ?? null;
        $this->odooDb = $_ENV['ODOO_DB'] ?? null;
        $this->odooUser = $_ENV['ODOO_API_USER'] ?? null;
        $this->odooPassword = $_ENV['ODOO_API_PASSWORD'] ?? null;
        $this->odooTeamId = isset($_ENV['ODOO_TEAM_ID']) ? (int)$_ENV['ODOO_TEAM_ID'] : null;
        $this->odooUserId = isset($_ENV['ODOO_USER_ID']) ? (int)$_ENV['ODOO_USER_ID'] : null;
    }

    /**
     * Synchronise un lead vers Odoo CRM
     * 
     * @param Lead $lead Le lead à synchroniser
     * @return void
     */
    public function syncLeadToOdoo(Lead $lead): void
    {
        // Vérifier que le lead peut être synchronisé
        if (!$lead->canSyncToOdoo()) {
            $this->logger->info('Lead déjà synchronisé ou email manquant', [
                'lead_id' => $lead->getId(),
                'odoo_sync_status' => $lead->getOdooSyncStatus(),
            ]);
            return;
        }

        // Marquer comme pending
        $lead->markAsSyncPending();
        $this->entityManager->flush();

        try {
            // Authentification Odoo
            $uid = $this->authenticate();
            if (!$uid) {
                throw new \Exception('Échec authentification Odoo');
            }

            // Mapping Lead → crm.lead
            $crmLeadData = $this->mapLeadToOdoo($lead, $uid);

            // Créer le lead dans Odoo
            $odooLeadId = $this->createCrmLead($uid, $crmLeadData);

            // Marquer comme synchronisé avec succès
            $lead->markAsSynced($odooLeadId);
            $this->entityManager->flush();

            $this->logger->info('Lead synchronisé avec succès vers Odoo', [
                'lead_id' => $lead->getId(),
                'odoo_lead_id' => $odooLeadId,
            ]);

        } catch (\Exception $e) {
            // Marquer comme échec
            $lead->markAsSyncFailed();
            $this->entityManager->flush();

            $this->logger->error('Erreur synchronisation Odoo', [
                'lead_id' => $lead->getId(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Authentifie l'utilisateur Odoo et retourne l'UID
     * 
     * @return int|null UID de l'utilisateur ou null si échec
     */
    private function authenticate(): ?int
    {
        if (!$this->odooUrl || !$this->odooDb || !$this->odooUser || !$this->odooPassword) {
            throw new \Exception('Configuration Odoo incomplète');
        }

        try {
            $url = rtrim($this->odooUrl, '/') . '/xmlrpc/2/common';
            $response = $this->callXmlRpc($url, 'authenticate', [
                $this->odooDb,
                $this->odooUser,
                $this->odooPassword,
                [],
            ]);

            if (isset($response['fault'])) {
                throw new \Exception('Erreur authentification Odoo: ' . $response['fault']['faultString']);
            }

            return $response ? (int)$response : null;

        } catch (\Exception $e) {
            $this->logger->error('Erreur authentification Odoo', [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Appelle une méthode XML-RPC
     * 
     * @param string $url URL du endpoint XML-RPC
     * @param string $method Nom de la méthode
     * @param array $params Paramètres
     * @return mixed Résultat de l'appel
     */
    private function callXmlRpc(string $url, string $method, array $params): mixed
    {
        // Construire le XML-RPC request
        $xml = $this->buildXmlRpcRequest($method, $params);
        
        // Envoyer la requête avec curl
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $xml);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: text/xml',
            'Content-Length: ' . strlen($xml),
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception('Erreur curl: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new \Exception('Erreur HTTP: ' . $httpCode);
        }

        // Parser la réponse XML-RPC
        return $this->parseXmlRpcResponse($response);
    }

    /**
     * Construit une requête XML-RPC
     * 
     * @param string $method Nom de la méthode
     * @param array $params Paramètres
     * @return string XML de la requête
     */
    private function buildXmlRpcRequest(string $method, array $params): string
    {
        $xml = '<?xml version="1.0"?><methodCall><methodName>' . htmlspecialchars($method) . '</methodName><params>';
        
        foreach ($params as $param) {
            $xml .= '<param><value>' . $this->buildXmlRpcValue($param) . '</value></param>';
        }
        
        $xml .= '</params></methodCall>';
        return $xml;
    }

    /**
     * Construit la valeur XML-RPC d'un paramètre
     * 
     * @param mixed $value Valeur à encoder
     * @return string XML de la valeur
     */
    private function buildXmlRpcValue($value): string
    {
        if (is_int($value)) {
            return '<int>' . $value . '</int>';
        } elseif (is_bool($value)) {
            return '<boolean>' . ($value ? '1' : '0') . '</boolean>';
        } elseif (is_array($value)) {
            if ($this->isAssociativeArray($value)) {
                // Struct
                $xml = '<struct>';
                foreach ($value as $key => $val) {
                    $xml .= '<member><name>' . htmlspecialchars($key) . '</name><value>' . $this->buildXmlRpcValue($val) . '</value></member>';
                }
                $xml .= '</struct>';
                return $xml;
            } else {
                // Array
                $xml = '<array><data>';
                foreach ($value as $val) {
                    $xml .= '<value>' . $this->buildXmlRpcValue($val) . '</value>';
                }
                $xml .= '</data></array>';
                return $xml;
            }
        } else {
            return '<string>' . htmlspecialchars((string)$value) . '</string>';
        }
    }

    /**
     * Vérifie si un tableau est associatif
     * 
     * @param array $array
     * @return bool
     */
    private function isAssociativeArray(array $array): bool
    {
        return array_keys($array) !== range(0, count($array) - 1);
    }

    /**
     * Parse une réponse XML-RPC
     * 
     * @param string $xml XML de la réponse
     * @return mixed Valeur parsée
     */
    private function parseXmlRpcResponse(string $xml): mixed
    {
        $xml = simplexml_load_string($xml);
        
        if (!$xml) {
            throw new \Exception('Erreur parsing XML-RPC response');
        }

        // Vérifier si c'est une faute
        if (isset($xml->fault)) {
            return [
                'fault' => [
                    'faultCode' => (int)$xml->fault->value->struct->member[0]->value->int,
                    'faultString' => (string)$xml->fault->value->struct->member[1]->value->string,
                ],
            ];
        }

        // Parser la valeur
        return $this->parseXmlRpcValue($xml->params->param->value);
    }

    /**
     * Parse une valeur XML-RPC
     * 
     * @param \SimpleXMLElement $value
     * @return mixed
     */
    private function parseXmlRpcValue(\SimpleXMLElement $value): mixed
    {
        $children = $value->children();
        $type = $children->getName();

        switch ($type) {
            case 'int':
            case 'i4':
                return (int)$children;
            case 'boolean':
                return (bool)(int)$children;
            case 'string':
                return (string)$children;
            case 'array':
                $result = [];
                foreach ($children->data->value as $val) {
                    $result[] = $this->parseXmlRpcValue($val);
                }
                return $result;
            case 'struct':
                $result = [];
                foreach ($children->member as $member) {
                    $key = (string)$member->name;
                    $result[$key] = $this->parseXmlRpcValue($member->value);
                }
                return $result;
            default:
                return (string)$children;
        }
    }

    /**
     * Mappe les champs Lead vers les données crm.lead Odoo
     * 
     * @param Lead $lead Le lead à mapper
     * @param int $uid UID utilisateur Odoo
     * @return array Données pour création crm.lead
     */
    private function mapLeadToOdoo(Lead $lead, int $uid): array
    {
        // Construire la description avec tous les détails
        $description = $this->buildDescription($lead);

        // Récupérer ou créer source marketing
        $sourceId = null;
        if ($lead->getUtmSource()) {
            $sourceId = $this->getOrCreateSource($uid, $lead->getUtmSource());
        }

        // Récupérer ou créer campagne marketing
        $campaignId = null;
        if ($lead->getUtmCampaign()) {
            $campaignId = $this->getOrCreateCampaign($uid, $lead->getUtmCampaign());
        }

        // Données crm.lead
        $crmLeadData = [
            'name' => $lead->getCompanyName() ?: $lead->getEmail(), // Nom de l'enseigne ou email
            'email_from' => $lead->getEmail(),
            'description' => $description,
            'type' => 'lead',
        ];

        // Fonction (role)
        if ($lead->getRole()) {
            $crmLeadData['function'] = $this->mapRoleToFunction($lead->getRole());
        }

        // Source marketing
        if ($sourceId) {
            $crmLeadData['source_id'] = $sourceId;
        }

        // Campagne marketing
        if ($campaignId) {
            $crmLeadData['campaign_id'] = $campaignId;
        }

        // Équipe commerciale
        if ($this->odooTeamId) {
            $crmLeadData['team_id'] = $this->odooTeamId;
        }

        // Commercial par défaut
        if ($this->odooUserId) {
            $crmLeadData['user_id'] = $this->odooUserId;
        }

        return $crmLeadData;
    }

    /**
     * Construit la description du lead pour Odoo
     * 
     * @param Lead $lead Le lead
     * @return string Description complète
     */
    private function buildDescription(Lead $lead): string
    {
        $parts = [];

        // Informations entreprise (nouveaux champs)
        if ($lead->getCompanyName()) {
            $parts[] = "Nom de l'enseigne : " . $lead->getCompanyName();
        }

        if ($lead->getFiscalCountry()) {
            $parts[] = "Pays fiscal : " . ($lead->getFiscalCountry() === 'france' ? 'France' : 'Autre pays');
        }

        if ($lead->getSiret()) {
            $parts[] = "SIRET : " . $lead->getSiret();
        }

        // Anciens champs (conservés pour compatibilité)
        if ($lead->getMessage()) {
            $parts[] = "Message :\n" . $lead->getMessage();
        }

        if ($lead->getStack()) {
            $parts[] = "Stack technique : " . $lead->getStack();
        }

        if ($lead->getVolume()) {
            $parts[] = "Volume : " . $lead->getVolume();
        }

        if ($lead->getReferrer()) {
            $parts[] = "Referrer : " . $lead->getReferrer();
        }

        if ($lead->getUtmMedium()) {
            $parts[] = "UTM Medium : " . $lead->getUtmMedium();
        }

        if ($lead->getUtmContent()) {
            $parts[] = "UTM Content : " . $lead->getUtmContent();
        }

        return implode("\n\n", $parts) ?: 'Lead capturé depuis la landing page Dorevia-Vault';
    }

    /**
     * Mappe le rôle Lead vers la fonction Odoo
     * 
     * @param string $role Rôle du lead
     * @return string Fonction Odoo
     */
    private function mapRoleToFunction(string $role): string
    {
        $mapping = [
            'dirigeant' => 'Dirigeant',
            'daf' => 'DAF / RAF',
            'expert_comptable' => 'Expert-comptable',
            'responsable_admin' => 'Responsable administratif',
            'autre' => 'Autre',
            // Anciens rôles (conservés pour compatibilité)
            'comptable' => 'Comptable',
            'cabinet' => 'Cabinet comptable',
            'retail' => 'Retail',
            'it_integrateur' => 'Intégrateur IT',
        ];

        return $mapping[$role] ?? $role;
    }

    /**
     * Récupère ou crée une source marketing dans Odoo
     * 
     * @param int $uid UID utilisateur Odoo
     * @param string $sourceName Nom de la source
     * @return int|null ID de la source ou null
     */
    private function getOrCreateSource(int $uid, string $sourceName): ?int
    {
        try {
            $url = rtrim($this->odooUrl, '/') . '/xmlrpc/2/object';

            // Rechercher source existante
            $response = $this->callXmlRpc($url, 'execute_kw', [
                $this->odooDb,
                $uid,
                $this->odooPassword,
                'utm.source',
                'search',
                [[['name', '=', $sourceName]]],
                ['limit' => 1],
            ]);

            if (isset($response['fault'])) {
                $this->logger->warning('Erreur recherche source Odoo', [
                    'source' => $sourceName,
                    'error' => $response['fault']['faultString'],
                ]);
                return null;
            }

            if (!empty($response) && is_array($response)) {
                return (int)$response[0];
            }

            // Créer source si absente
            $createResponse = $this->callXmlRpc($url, 'execute_kw', [
                $this->odooDb,
                $uid,
                $this->odooPassword,
                'utm.source',
                'create',
                [['name' => $sourceName]],
            ]);

            if (isset($createResponse['fault'])) {
                $this->logger->warning('Erreur création source Odoo', [
                    'source' => $sourceName,
                    'error' => $createResponse['fault']['faultString'],
                ]);
                return null;
            }

            return (int)$createResponse;

        } catch (\Exception $e) {
            $this->logger->error('Erreur getOrCreateSource', [
                'source' => $sourceName,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Récupère ou crée une campagne marketing dans Odoo
     * 
     * @param int $uid UID utilisateur Odoo
     * @param string $campaignName Nom de la campagne
     * @return int|null ID de la campagne ou null
     */
    private function getOrCreateCampaign(int $uid, string $campaignName): ?int
    {
        try {
            $url = rtrim($this->odooUrl, '/') . '/xmlrpc/2/object';

            // Rechercher campagne existante
            $response = $this->callXmlRpc($url, 'execute_kw', [
                $this->odooDb,
                $uid,
                $this->odooPassword,
                'utm.campaign',
                'search',
                [[['name', '=', $campaignName]]],
                ['limit' => 1],
            ]);

            if (isset($response['fault'])) {
                $this->logger->warning('Erreur recherche campagne Odoo', [
                    'campaign' => $campaignName,
                    'error' => $response['fault']['faultString'],
                ]);
                return null;
            }

            if (!empty($response) && is_array($response)) {
                return (int)$response[0];
            }

            // Créer campagne si absente
            $createResponse = $this->callXmlRpc($url, 'execute_kw', [
                $this->odooDb,
                $uid,
                $this->odooPassword,
                'utm.campaign',
                'create',
                [['name' => $campaignName]],
            ]);

            if (isset($createResponse['fault'])) {
                $this->logger->warning('Erreur création campagne Odoo', [
                    'campaign' => $campaignName,
                    'error' => $createResponse['fault']['faultString'],
                ]);
                return null;
            }

            return (int)$createResponse;

        } catch (\Exception $e) {
            $this->logger->error('Erreur getOrCreateCampaign', [
                'campaign' => $campaignName,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Crée un crm.lead dans Odoo
     * 
     * @param int $uid UID utilisateur Odoo
     * @param array $crmLeadData Données du lead
     * @return int ID du lead créé dans Odoo
     * @throws \Exception En cas d'erreur
     */
    private function createCrmLead(int $uid, array $crmLeadData): int
    {
        try {
            $url = rtrim($this->odooUrl, '/') . '/xmlrpc/2/object';

            $response = $this->callXmlRpc($url, 'execute_kw', [
                $this->odooDb,
                $uid,
                $this->odooPassword,
                'crm.lead',
                'create',
                [$crmLeadData],
            ]);

            if (isset($response['fault'])) {
                throw new \Exception('Erreur création crm.lead: ' . $response['fault']['faultString']);
            }

            return (int)$response;

        } catch (\Exception $e) {
            $this->logger->error('Erreur création crm.lead Odoo', [
                'data' => $crmLeadData,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
