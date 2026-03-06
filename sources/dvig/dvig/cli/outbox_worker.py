"""
CLI pour exécuter le worker outbox
Usage: python -m dvig.cli.outbox_worker [--limit 50]
"""
import argparse
import asyncio
import sys
import os

# Ajouter le chemin parent pour les imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../..'))

from workers.outbox_worker import process_outbox_events


def main():
    parser = argparse.ArgumentParser(description='Worker outbox DVIG - Traite les événements en attente')
    parser.add_argument(
        '--limit',
        type=int,
        default=50,
        help='Nombre maximum d\'événements à traiter (défaut: 50)'
    )
    
    args = parser.parse_args()
    
    # Exécuter le worker
    stats = asyncio.run(process_outbox_events(limit=args.limit))
    
    # Afficher les statistiques
    print(f"✅ Traitement terminé:")
    print(f"   - Traités: {stats['processed']}")
    print(f"   - Succès: {stats['succeeded']}")
    print(f"   - Échecs soft: {stats['failed_soft']}")
    print(f"   - Échecs hard: {stats['failed_hard']}")
    
    # Code de sortie : 0 si succès, 1 si erreurs
    exit_code = 0 if stats['failed_hard'] == 0 else 1
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
