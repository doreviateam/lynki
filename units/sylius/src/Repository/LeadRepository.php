<?php

namespace App\Repository;

use App\Entity\Lead;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Lead>
 *
 * @method Lead|null find($id, $lockMode = null, $lockVersion = null)
 * @method Lead|null findOneBy(array $criteria, array $orderBy = null)
 * @method Lead[]    findAll()
 * @method Lead[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class LeadRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Lead::class);
    }

    /**
     * Trouve un lead par son UUID public
     */
    public function findByPublicUuid(string $publicUuid): ?Lead
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.publicUuid = :uuid')
            ->setParameter('uuid', $publicUuid)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve les leads à synchroniser vers Odoo
     * (status = pending ou null, et email non null)
     */
    public function findLeadsToSync(): array
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.email IS NOT NULL')
            ->andWhere('l.odooSyncStatus IS NULL OR l.odooSyncStatus = :pending')
            ->setParameter('pending', 'pending')
            ->orderBy('l.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les leads à supprimer (RGPD : > 24 mois)
     * 
     * @param \DateTimeImmutable $cutoffDate Date limite (généralement -24 mois)
     * @return Lead[]
     */
    public function findLeadsToDelete(\DateTimeImmutable $cutoffDate): array
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.createdAt < :dateLimit')
            ->setParameter('dateLimit', $cutoffDate)
            ->getQuery()
            ->getResult();
    }

    /**
     * Compte les leads par statut
     */
    public function countByStatus(string $status): int
    {
        return $this->createQueryBuilder('l')
            ->select('COUNT(l.id)')
            ->andWhere('l.status = :status')
            ->setParameter('status', $status)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Trouve les leads par email (pour éviter les doublons)
     */
    public function findByEmail(string $email): ?Lead
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.email = :email')
            ->setParameter('email', $email)
            ->orderBy('l.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
