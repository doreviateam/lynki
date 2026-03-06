<?php

namespace App\Entity;

use App\Repository\LeadRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Lead Entity
 * 
 * Représente un lead capturé depuis la landing page Dorevia-Vault.
 * Synchronisé automatiquement vers Odoo CRM (crm.lead).
 */
#[ORM\Entity(repositoryClass: LeadRepository::class)]
#[ORM\Table(name: 'leads')]
#[ORM\HasLifecycleCallbacks]
class Lead
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    /**
     * UUID public unique pour identification externe
     */
    #[ORM\Column(type: Types::GUID, unique: true)]
    private ?string $publicUuid = null;

    /**
     * Date de création du lead
     */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    /**
     * Email du lead (obligatoire)
     */
    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Assert\NotBlank(message: "L'email est obligatoire")]
    #[Assert\Email(message: "L'email n'est pas valide")]
    private ?string $email = null;

    /**
     * Rôle du lead (optionnel)
     * Valeurs possibles : dirigeant, daf, expert_comptable, responsable_admin, autre
     */
    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    #[Assert\Choice(
        choices: ['dirigeant', 'daf', 'expert_comptable', 'responsable_admin', 'autre'],
        message: "Le rôle n'est pas valide"
    )]
    private ?string $role = null;

    /**
     * Stack technique (optionnel)
     */
    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $stack = null;

    /**
     * Volume de factures (optionnel)
     */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $volume = null;

    /**
     * Message libre du lead (obligatoire)
     */
    #[ORM\Column(type: Types::TEXT)]
    #[Assert\NotBlank(message: "Le message est obligatoire")]
    #[Assert\Length(
        min: 10,
        max: 2000,
        minMessage: "Le message doit contenir au moins {{ limit }} caractères",
        maxMessage: "Le message ne peut pas dépasser {{ limit }} caractères"
    )]
    private ?string $message = null;

    /**
     * Nom de l'enseigne (optionnel)
     */
    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $companyName = null;

    /**
     * Pays fiscal (optionnel)
     * Valeurs possibles : france, autre
     */
    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    #[Assert\Choice(
        choices: ['france', 'autre'],
        message: "Le pays fiscal n'est pas valide"
    )]
    private ?string $fiscalCountry = null;

    /**
     * SIRET (optionnel, conditionnel si fiscalCountry = france)
     * 14 chiffres uniquement
     */
    #[ORM\Column(type: Types::STRING, length: 14, nullable: true)]
    private ?string $siret = null;

    /**
     * Source UTM (optionnel)
     */
    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $utmSource = null;

    /**
     * Campagne UTM (optionnel)
     */
    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $utmCampaign = null;

    /**
     * Medium UTM (optionnel)
     */
    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $utmMedium = null;

    /**
     * Content UTM (optionnel)
     */
    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $utmContent = null;

    /**
     * Referrer (optionnel)
     */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $referrer = null;

    /**
     * Statut du lead
     * Valeurs possibles : new, contacted, qualified, converted, archived
     * Par défaut : new
     */
    #[ORM\Column(type: Types::STRING, length: 50, options: ['default' => 'new'])]
    #[Assert\Choice(
        choices: ['new', 'contacted', 'qualified', 'converted', 'archived'],
        message: "Le statut n'est pas valide"
    )]
    private string $status = 'new';

    /**
     * Hash de l'IP (optionnel, pour anonymisation)
     */
    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $ipHash = null;

    /**
     * User Agent (optionnel)
     */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $userAgent = null;

    /**
     * ID du lead dans Odoo (optionnel)
     */
    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $odooLeadId = null;

    /**
     * Statut de synchronisation Odoo
     * Valeurs possibles : success, failed, pending
     */
    #[ORM\Column(type: Types::STRING, length: 20, nullable: true)]
    #[Assert\Choice(
        choices: ['success', 'failed', 'pending'],
        message: "Le statut de synchronisation n'est pas valide"
    )]
    private ?string $odooSyncStatus = null;

    /**
     * Date de synchronisation Odoo (optionnel)
     */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $odooSyncedAt = null;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        if ($this->createdAt === null) {
            $this->createdAt = new \DateTimeImmutable();
        }
    }

    #[ORM\PrePersist]
    public function setPublicUuidValue(): void
    {
        if ($this->publicUuid === null) {
            $this->publicUuid = Uuid::v4()->toRfc4122();
        }
    }

    // Getters and Setters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPublicUuid(): ?string
    {
        return $this->publicUuid;
    }

    public function setPublicUuid(string $publicUuid): self
    {
        $this->publicUuid = $publicUuid;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }

    public function getRole(): ?string
    {
        return $this->role;
    }

    public function setRole(string $role): self
    {
        $this->role = $role;
        return $this;
    }

    public function getStack(): ?string
    {
        return $this->stack;
    }

    public function setStack(?string $stack): self
    {
        $this->stack = $stack;
        return $this;
    }

    public function getVolume(): ?string
    {
        return $this->volume;
    }

    public function setVolume(?string $volume): self
    {
        $this->volume = $volume;
        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(?string $message): self
    {
        $this->message = $message;
        return $this;
    }

    public function getUtmSource(): ?string
    {
        return $this->utmSource;
    }

    public function setUtmSource(?string $utmSource): self
    {
        $this->utmSource = $utmSource;
        return $this;
    }

    public function getUtmCampaign(): ?string
    {
        return $this->utmCampaign;
    }

    public function setUtmCampaign(?string $utmCampaign): self
    {
        $this->utmCampaign = $utmCampaign;
        return $this;
    }

    public function getUtmMedium(): ?string
    {
        return $this->utmMedium;
    }

    public function setUtmMedium(?string $utmMedium): self
    {
        $this->utmMedium = $utmMedium;
        return $this;
    }

    public function getUtmContent(): ?string
    {
        return $this->utmContent;
    }

    public function setUtmContent(?string $utmContent): self
    {
        $this->utmContent = $utmContent;
        return $this;
    }

    public function getReferrer(): ?string
    {
        return $this->referrer;
    }

    public function setReferrer(?string $referrer): self
    {
        $this->referrer = $referrer;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;
        return $this;
    }

    public function getIpHash(): ?string
    {
        return $this->ipHash;
    }

    public function setIpHash(?string $ipHash): self
    {
        $this->ipHash = $ipHash;
        return $this;
    }

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function setUserAgent(?string $userAgent): self
    {
        $this->userAgent = $userAgent;
        return $this;
    }

    public function getOdooLeadId(): ?int
    {
        return $this->odooLeadId;
    }

    public function setOdooLeadId(?int $odooLeadId): self
    {
        $this->odooLeadId = $odooLeadId;
        return $this;
    }

    public function getOdooSyncStatus(): ?string
    {
        return $this->odooSyncStatus;
    }

    public function setOdooSyncStatus(?string $odooSyncStatus): self
    {
        $this->odooSyncStatus = $odooSyncStatus;
        return $this;
    }

    public function getOdooSyncedAt(): ?\DateTimeImmutable
    {
        return $this->odooSyncedAt;
    }

    public function setOdooSyncedAt(?\DateTimeImmutable $odooSyncedAt): self
    {
        $this->odooSyncedAt = $odooSyncedAt;
        return $this;
    }

    /**
     * Vérifie si le lead peut être synchronisé vers Odoo
     */
    public function canSyncToOdoo(): bool
    {
        return $this->odooSyncStatus !== 'success' && $this->email !== null;
    }

    /**
     * Marque le lead comme synchronisé avec succès
     */
    public function markAsSynced(int $odooLeadId): self
    {
        $this->odooLeadId = $odooLeadId;
        $this->odooSyncStatus = 'success';
        $this->odooSyncedAt = new \DateTimeImmutable();
        return $this;
    }

    /**
     * Marque le lead comme échec de synchronisation
     */
    public function markAsSyncFailed(): self
    {
        $this->odooSyncStatus = 'failed';
        return $this;
    }

    /**
     * Marque le lead comme en attente de synchronisation
     */
    public function markAsSyncPending(): self
    {
        $this->odooSyncStatus = 'pending';
        return $this;
    }

    public function getCompanyName(): ?string
    {
        return $this->companyName;
    }

    public function setCompanyName(?string $companyName): self
    {
        $this->companyName = $companyName;
        return $this;
    }

    public function getFiscalCountry(): ?string
    {
        return $this->fiscalCountry;
    }

    public function setFiscalCountry(?string $fiscalCountry): self
    {
        $this->fiscalCountry = $fiscalCountry;
        return $this;
    }

    public function getSiret(): ?string
    {
        return $this->siret;
    }

    public function setSiret(?string $siret): self
    {
        $this->siret = $siret;
        return $this;
    }
}
