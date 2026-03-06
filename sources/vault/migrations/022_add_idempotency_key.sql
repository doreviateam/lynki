-- Migration 022 : Ajout du champ idempotency_key pour l'idempotence bout en bout
-- SPEC DVIG → Vault Forwarding v1.1
-- Permet la vérification d'idempotence via UNIQUE(tenant, idempotency_key)

-- Ajouter la colonne idempotency_key
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);

-- Créer l'index UNIQUE pour garantir l'idempotence
-- Note: UNIQUE permet NULL, donc on filtre les NULL pour l'index
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_tenant_idempotency 
  ON documents(tenant, idempotency_key) 
  WHERE tenant IS NOT NULL AND idempotency_key IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN documents.idempotency_key IS 'Clé d''idempotence SHA256 transmise par DVIG pour garantir l''idempotence bout en bout (SPEC DVIG → Vault Forwarding v1.1)';
COMMENT ON INDEX idx_documents_tenant_idempotency IS 'Index UNIQUE pour garantir l''idempotence via (tenant, idempotency_key)';
