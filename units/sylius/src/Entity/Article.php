<?php

namespace App\Entity;

use App\Repository\ArticleRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Article Entity
 * 
 * Représente un article de blog Dorevia-Vault.
 */
#[ORM\Entity(repositoryClass: ArticleRepository::class)]
#[ORM\Table(name: 'articles')]
#[ORM\HasLifecycleCallbacks]
#[ORM\Index(columns: ['slug'], name: 'idx_article_slug')]
#[ORM\Index(columns: ['status', 'published_at'], name: 'idx_article_status_published')]
class Article
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
     * Titre de l'article
     */
    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Assert\NotBlank(message: "Le titre est obligatoire")]
    #[Assert\Length(max: 255, maxMessage: "Le titre ne peut pas dépasser 255 caractères")]
    private ?string $title = null;

    /**
     * Slug pour URL (unique)
     */
    #[ORM\Column(type: Types::STRING, length: 255, unique: true)]
    #[Assert\NotBlank(message: "Le slug est obligatoire")]
    #[Assert\Length(max: 255, maxMessage: "Le slug ne peut pas dépasser 255 caractères")]
    private ?string $slug = null;

    /**
     * Contenu de l'article (Markdown ou HTML)
     */
    #[ORM\Column(type: Types::TEXT)]
    #[Assert\NotBlank(message: "Le contenu est obligatoire")]
    private ?string $content = null;

    /**
     * Extrait/description courte pour les listes
     */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $excerpt = null;

    /**
     * Auteur de l'article
     */
    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Assert\NotBlank(message: "L'auteur est obligatoire")]
    private ?string $author = null;

    /**
     * Date de publication (optionnel, null = brouillon)
     */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $publishedAt = null;

    /**
     * Statut de l'article
     * Valeurs possibles : draft, published, archived
     * Par défaut : draft
     */
    #[ORM\Column(type: Types::STRING, length: 50, options: ['default' => 'draft'])]
    #[Assert\Choice(
        choices: ['draft', 'published', 'archived'],
        message: "Le statut n'est pas valide"
    )]
    private string $status = 'draft';

    /**
     * Meta description pour SEO
     */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $metaDescription = null;

    /**
     * Meta keywords pour SEO (optionnel)
     */
    #[ORM\Column(type: Types::STRING, length: 500, nullable: true)]
    private ?string $metaKeywords = null;

    /**
     * Image de couverture (URL ou chemin)
     */
    #[ORM\Column(type: Types::STRING, length: 500, nullable: true)]
    private ?string $coverImage = null;

    /**
     * Catégorie de l'article (obligatoire, max 1)
     * Valeurs possibles selon spec : Conformité & réglementation, ERP & Odoo CE, Trésorerie & pilotage, Preuve & audit, Architecture & sécurité
     */
    #[ORM\Column(type: Types::STRING, length: 100)]
    #[Assert\NotBlank(message: "La catégorie est obligatoire")]
    #[Assert\Length(max: 100, maxMessage: "La catégorie ne peut pas dépasser 100 caractères")]
    private ?string $category = null;

    /**
     * Tags de l'article (facultatif, max 6)
     * Stocké en JSON : ["nf525", "pdp", "ppf", "audit"]
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $tags = null;

    /**
     * Chapeau / Introduction courte (2-3 lignes)
     */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $chapeau = null;

    /**
     * Article mis en avant sur la page listing
     */
    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => false])]
    private bool $featured = false;

    /**
     * Date de création
     */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    /**
     * Date de mise à jour
     */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $updatedAt = null;

    /**
     * Nombre de vues (optionnel, pour statistiques)
     */
    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $views = 0;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        if ($this->createdAt === null) {
            $this->createdAt = new \DateTimeImmutable();
        }
        if ($this->updatedAt === null) {
            $this->updatedAt = new \DateTimeImmutable();
        }
    }

    #[ORM\PrePersist]
    public function setPublicUuidValue(): void
    {
        if ($this->publicUuid === null) {
            $this->publicUuid = Uuid::v4()->toRfc4122();
        }
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
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

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;
        return $this;
    }

    public function getSlug(): ?string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): self
    {
        $this->slug = $slug;
        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): self
    {
        $this->content = $content;
        return $this;
    }

    public function getExcerpt(): ?string
    {
        return $this->excerpt;
    }

    public function setExcerpt(?string $excerpt): self
    {
        $this->excerpt = $excerpt;
        return $this;
    }

    public function getAuthor(): ?string
    {
        return $this->author;
    }

    public function setAuthor(string $author): self
    {
        $this->author = $author;
        return $this;
    }

    public function getPublishedAt(): ?\DateTimeImmutable
    {
        return $this->publishedAt;
    }

    public function setPublishedAt(?\DateTimeImmutable $publishedAt): self
    {
        $this->publishedAt = $publishedAt;
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

    public function getMetaDescription(): ?string
    {
        return $this->metaDescription;
    }

    public function setMetaDescription(?string $metaDescription): self
    {
        $this->metaDescription = $metaDescription;
        return $this;
    }

    public function getMetaKeywords(): ?string
    {
        return $this->metaKeywords;
    }

    public function setMetaKeywords(?string $metaKeywords): self
 {
        $this->metaKeywords = $metaKeywords;
        return $this;
    }

    public function getCoverImage(): ?string
    {
        return $this->coverImage;
    }

    public function setCoverImage(?string $coverImage): self
    {
        $this->coverImage = $coverImage;
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

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function getViews(): int
    {
        return $this->views;
    }

    public function setViews(int $views): self
    {
        $this->views = $views;
        return $this;
    }

    public function incrementViews(): self
    {
        $this->views++;
        return $this;
    }

    /**
     * Vérifie si l'article est publié
     */
    public function isPublished(): bool
    {
        return $this->status === 'published' && $this->publishedAt !== null && $this->publishedAt <= new \DateTimeImmutable();
    }

    /**
     * Calcule le temps de lecture estimé (en minutes)
     * Basé sur 200 mots par minute (moyenne de lecture)
     */
    public function getReadingTime(): int
    {
        if (!$this->content) {
            return 1;
        }

        // Compter les mots (supprimer HTML/Markdown basique)
        $text = strip_tags($this->content);
        $text = preg_replace('/[#*`\[\]()]/', ' ', $text); // Supprimer syntaxe Markdown
        $text = preg_replace('/\s+/', ' ', $text); // Normaliser espaces
        $wordCount = str_word_count(trim($text));

        // 200 mots par minute
        $minutes = max(1, (int) ceil($wordCount / 200));
        return $minutes;
    }

    // Getters and Setters pour les nouveaux champs

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(?string $category): self
    {
        $this->category = $category;
        return $this;
    }

    public function getTags(): ?array
    {
        return $this->tags;
    }

    public function setTags(?array $tags): self
    {
        // Limiter à 6 tags maximum
        if ($tags !== null && count($tags) > 6) {
            $tags = array_slice($tags, 0, 6);
        }
        $this->tags = $tags;
        return $this;
    }

    public function getChapeau(): ?string
    {
        return $this->chapeau;
    }

    public function setChapeau(?string $chapeau): self
    {
        $this->chapeau = $chapeau;
        return $this;
    }

    public function isFeatured(): bool
    {
        return $this->featured;
    }

    public function setFeatured(bool $featured): self
    {
        $this->featured = $featured;
        return $this;
    }
}
