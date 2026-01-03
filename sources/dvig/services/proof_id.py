"""
Service de génération du proof_id canonique
Format: dvlt_<tenant>_<YYYYMMDD>_<sequence>
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from storage.proofs import Proof


def generate_proof_id(tenant: str, db: Session) -> str:
    """
    Génère un proof_id canonique avec protection concurrente.
    
    ⚠️ LIMITE MONO-INSTANCE :
    - La génération du proof_id est garantie unique dans un contexte mono-instance DVIG
    - Protection via verrou transactionnel DB (SELECT ... FOR UPDATE)
    - La distribution multi-instance fera l'objet d'une évolution ultérieure
    
    Args:
        tenant: Identifiant du tenant
        db: Session SQLAlchemy
        
    Returns:
        proof_id au format: dvlt_<tenant>_<YYYYMMDD>_<sequence>
        
    Raises:
        ValueError: Si la séquence quotidienne est épuisée (> 999999)
    """
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    
    # Verrou transactionnel pour éviter les collisions (mono-instance)
    # ⚠️ Si une transaction est déjà en cours, on l'utilise directement
    # (Évite les erreurs "A transaction is already begun on this Session")
    if db.in_transaction():
        # Transaction déjà en cours : utiliser directement
        stmt = (
            select(Proof)
            .where(Proof.tenant == tenant)
            .where(Proof.date == today)
            .order_by(Proof.sequence.desc())
            .with_for_update()
            .limit(1)
        )
        last_proof = db.execute(stmt).scalar_one_or_none()
    else:
        # Pas de transaction : en créer une
        with db.begin():
            stmt = (
                select(Proof)
                .where(Proof.tenant == tenant)
                .where(Proof.date == today)
                .order_by(Proof.sequence.desc())
                .with_for_update()
                .limit(1)
            )
            last_proof = db.execute(stmt).scalar_one_or_none()
    
    last_seq = last_proof.sequence if last_proof else 0
    next_seq = last_seq + 1
    
    if next_seq > 999999:
        raise ValueError("Séquence quotidienne épuisée")
    
    proof_id = f"dvlt_{tenant}_{today}_{next_seq:06d}"
    
    # Note : L'enregistrement Proof sera créé après le vaultage réussi
    # Le commit sera fait dans le handler
    
    return proof_id

