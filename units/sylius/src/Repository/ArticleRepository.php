<?php

namespace App\Repository;

use App\Entity\Article;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Article>
 *
 * @method Article|null find($id, $lockMode = null, $lockVersion = null)
 * @method Article|null findOneBy(array $criteria, array $orderBy = null)
 * @method Article[]    findAll()
 * @method Article[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ArticleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Article::class);
    }

    /**
     * Trouve un article par son slug
     */
    public function findBySlug(string $slug): ?Article
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.slug = :slug')
            ->andWhere('a.status = :status')
            ->andWhere('a.publishedAt <= :now OR a.publishedAt IS NULL')
            ->setParameter('slug', $slug)
            ->setParameter('status', 'published')
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve tous les articles publiés, triés par date de publication (plus récent en premier)
     * Exclut les articles sans catégorie
     */
    public function findPublishedArticles(int $limit = null, int $offset = null): array
    {
        $qb = $this->createQueryBuilder('a')
            ->andWhere('a.status = :status')
            ->andWhere('a.publishedAt <= :now')
            ->andWhere('a.category IS NOT NULL')
            ->setParameter('status', 'published')
            ->setParameter('now', new \DateTimeImmutable())
            ->orderBy('a.publishedAt', 'DESC');

        if ($limit !== null) {
            $qb->setMaxResults($limit);
        }
        if ($offset !== null) {
            $qb->setFirstResult($offset);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Trouve un article par son UUID public
     */
    public function findByPublicUuid(string $publicUuid): ?Article
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.publicUuid = :uuid')
            ->setParameter('uuid', $publicUuid)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Compte les articles publiés (avec catégorie)
     */
    public function countPublished(): int
    {
        return $this->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->andWhere('a.status = :status')
            ->andWhere('a.publishedAt <= :now')
            ->andWhere('a.category IS NOT NULL')
            ->setParameter('status', 'published')
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Trouve les articles publiés par catégorie
     */
    public function findPublishedByCategory(string $category, int $limit = null, int $offset = null): array
    {
        $qb = $this->createQueryBuilder('a')
            ->andWhere('a.status = :status')
            ->andWhere('a.publishedAt <= :now')
            ->andWhere('a.category = :category')
            ->setParameter('status', 'published')
            ->setParameter('now', new \DateTimeImmutable())
            ->setParameter('category', $category)
            ->orderBy('a.publishedAt', 'DESC');

        if ($limit !== null) {
            $qb->setMaxResults($limit);
        }
        if ($offset !== null) {
            $qb->setFirstResult($offset);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Récupère toutes les catégories distinctes des articles publiés
     */
    public function findAllCategories(): array
    {
        return $this->createQueryBuilder('a')
            ->select('DISTINCT a.category')
            ->andWhere('a.status = :status')
            ->andWhere('a.publishedAt <= :now')
            ->andWhere('a.category IS NOT NULL')
            ->setParameter('status', 'published')
            ->setParameter('now', new \DateTimeImmutable())
            ->orderBy('a.category', 'ASC')
            ->getQuery()
            ->getSingleColumnResult();
    }

    /**
     * Trouve les articles liés (même catégorie, excluant l'article courant)
     */
    public function findRelatedArticles(Article $article, int $limit = 3): array
    {
        $qb = $this->createQueryBuilder('a')
            ->andWhere('a.status = :status')
            ->andWhere('a.publishedAt <= :now')
            ->andWhere('a.id != :currentId')
            ->setParameter('status', 'published')
            ->setParameter('now', new \DateTimeImmutable())
            ->setParameter('currentId', $article->getId())
            ->orderBy('a.publishedAt', 'DESC')
            ->setMaxResults($limit);

        // Si l'article a une catégorie, filtrer par catégorie
        if ($article->getCategory()) {
            $qb->andWhere('a.category = :category')
               ->setParameter('category', $article->getCategory());
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Recherche plein texte dans les articles publiés (titre, extrait, contenu)
     */
    public function searchPublished(string $query, int $limit = null, int $offset = null): array
    {
        $searchTerm = '%' . $query . '%';
        
        $qb = $this->createQueryBuilder('a')
            ->andWhere('a.status = :status')
            ->andWhere('a.publishedAt <= :now')
            ->andWhere(
                '(a.title LIKE :search OR a.excerpt LIKE :search OR a.content LIKE :search)'
            )
            ->setParameter('status', 'published')
            ->setParameter('now', new \DateTimeImmutable())
            ->setParameter('search', $searchTerm)
            ->orderBy('a.publishedAt', 'DESC');

        if ($limit !== null) {
            $qb->setMaxResults($limit);
        }
        if ($offset !== null) {
            $qb->setFirstResult($offset);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Compte les résultats de recherche
     */
    public function countSearchResults(string $query): int
    {
        $searchTerm = '%' . $query . '%';
        
        return $this->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->andWhere('a.status = :status')
            ->andWhere('a.publishedAt <= :now')
            ->andWhere(
                '(a.title LIKE :search OR a.excerpt LIKE :search OR a.content LIKE :search)'
            )
            ->setParameter('status', 'published')
            ->setParameter('now', new \DateTimeImmutable())
            ->setParameter('search', $searchTerm)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Compte les articles publiés pour une catégorie donnée
     */
    public function countByCategory(string $category): int
    {
        return $this->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->andWhere('a.status = :status')
            ->andWhere('a.publishedAt <= :now')
            ->andWhere('a.category = :category')
            ->setParameter('status', 'published')
            ->setParameter('now', new \DateTimeImmutable())
            ->setParameter('category', $category)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
