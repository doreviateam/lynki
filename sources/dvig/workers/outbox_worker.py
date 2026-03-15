"""
Worker asynchrone pour traiter les événements de l'outbox
SPEC DVIG → Vault Forwarding v1.2

Routage par event_type :
  - invoice.posted           → POST /api/v1/invoices
  - payment.posted           → POST /api/v1/payments
  - bank.move.reconciled     → POST /api/v1/bank-reconciliation/events (SPEC RECONCIL)
  - bank.move.unreconciled   → POST /api/v1/bank-reconciliation/events
  - *                        → POST /api/v1/events (fallback)

Observabilité : trace_id propagé via X-Trace-Id, logs structurés.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
import httpx
import logging
import structlog
import time
import uuid as uuid_module

try:
    from storage.database import get_db
    from storage.outbox import (
        select_pending_events,
        update_event_status,
        increment_attempt_count
    )
    from models.outbox import OutboxEvent
    from config import get_settings
except ImportError:
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from storage.database import get_db
    from storage.outbox import (
        select_pending_events,
        update_event_status,
        increment_attempt_count
    )
    from models.outbox import OutboxEvent
    from config import get_settings

try:
    from metrics import (
        record_forward_success,
        record_forward_failed_soft,
        record_forward_failed_hard,
        record_forward_duration,
        record_erp_to_vault_duration,
        update_outbox_backlog,
        record_dead_letter
    )
    METRICS_AVAILABLE = True
except ImportError:
    METRICS_AVAILABLE = False
    def record_forward_success(*args, **kwargs): pass
    def record_forward_failed_soft(*args, **kwargs): pass
    def record_forward_failed_hard(*args, **kwargs): pass
    def record_forward_duration(*args, **kwargs): pass
    def record_erp_to_vault_duration(*args, **kwargs): pass
    def update_outbox_backlog(*args, **kwargs): pass
    def record_dead_letter(*args, **kwargs): pass

settings = get_settings()
log = structlog.get_logger("dvig.worker")


def calculate_next_retry(attempt_count: int) -> datetime:
    now = datetime.now(timezone.utc)
    delay_seconds = min(2 ** attempt_count * 60, 3600)
    return now + timedelta(seconds=delay_seconds)


def classify_error(error: Exception) -> tuple[str, bool]:
    error_str = str(error).lower()
    error_type = type(error).__name__

    if isinstance(error, httpx.TimeoutException):
        return ("timeout", True)

    if isinstance(error, httpx.HTTPStatusError):
        status_code = error.response.status_code
        if status_code in [502, 503, 429]:
            return (f"http_{status_code}", True)
        if status_code in [400, 401, 403, 404, 422]:
            return (f"http_{status_code}", False)

    if isinstance(error, (httpx.ConnectError, httpx.NetworkError)):
        return ("network_error", True)

    return (f"unknown_{error_type}", True)


# ── Payload formatters ─────────────────────────────────────────

def format_vault_payload_invoices(event: OutboxEvent) -> dict:
    """Format pour POST /api/v1/invoices (factures Odoo).

    Vault InvoicePayload attend : source, model, odoo_id, state, file, meta.
    Le file est un JSON base64 du payload complet (pas un vrai PDF).
    """
    import base64 as b64
    import json as _json

    payload = event.payload
    data = payload.get('data', {})
    move_type = data.get('move_type', 'out_invoice')

    if move_type in ('out_invoice', 'out_refund'):
        source = 'sales'
    elif move_type in ('in_invoice', 'in_refund'):
        source = 'purchase'
    else:
        source = 'sales'

    file_content = _json.dumps(data, ensure_ascii=False, sort_keys=True).encode('utf-8')
    file_b64 = b64.b64encode(file_content).decode('ascii')

    def _extract_partner_id(val):
        """Odoo peut envoyer partner_id comme [id, 'Name'] ou int."""
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return int(val)
        if isinstance(val, (list, tuple)) and len(val) >= 1:
            return int(val[0])
        if isinstance(val, str) and val.isdigit():
            return int(val)
        return None

    return {
        "source": source,
        "model": data.get('model', 'account.move'),
        "odoo_id": int(data.get('id', 0)),
        "state": "posted",
        "pdp_required": False,
        "file": file_b64,
        "meta": {
            "move_type": move_type,
            "tenant": event.tenant,
            "correlation_id": str(event.event_id),
            "idempotency_key": event.idempotency_key,
            "company_id": _extract_partner_id(data.get('company_id')) or 1,  # SPEC Company v1.1
            "invoice_number": data.get('name', ''),
            "number": data.get('name', ''),  # Alias pour Vault InvoicesHandler
            "partner_name": data.get('partner_name', ''),
            "partner_id": _extract_partner_id(data.get('partner_id')),
            "amount_total": data.get('amount_total'),
            "amount_untaxed": data.get('amount_untaxed'),
            "amount_tax": data.get('amount_tax'),
            "amount_residual": data.get('amount_residual'),
            "total_ht": data.get('amount_untaxed'),  # Alias pour Vault
            "total_ttc": data.get('amount_total'),   # Alias pour Vault
            "currency": data.get('currency', 'EUR'),
            "date": data.get('date', ''),
            "invoice_date": data.get('invoice_date', ''),
            "invoice_date_due": data.get('invoice_date_due'),
        },
    }


def format_vault_payload_bank_reconciliation(event: OutboxEvent) -> dict:
    """Format pour POST /api/v1/bank-reconciliation/events (SPEC RECONCIL — projection).

    Payload attendu : tenant, event_type, move_id, amount, occurred_at, idempotency.event_id.
    """
    payload = event.payload
    data = payload.get('data', {})
    event_type = payload.get('event_type', 'bank.move.reconciled')

    # move_id : move_line_id ou move_id ou id
    move_id = data.get('move_id') or data.get('move_line_id') or data.get('id') or 0
    if isinstance(move_id, list):
        move_id = move_id[0] if move_id else 0
    move_id = int(move_id)

    amount = float(data.get('amount', 0))
    occurred_at = payload.get('timestamp') or data.get('occurred_at') or datetime.now(timezone.utc).isoformat()

    # account_id, company_id optionnels
    account_id = data.get('account_id')
    if isinstance(account_id, list):
        account_id = account_id[0] if account_id else None
    if account_id is not None:
        account_id = int(account_id)

    company_id = data.get('company_id')
    if isinstance(company_id, list):
        company_id = company_id[0] if company_id else None
    if company_id is not None:
        company_id = int(company_id)

    result = {
        "tenant": event.tenant,
        "event_type": event_type,
        "move_id": move_id,
        "amount": amount,
        "occurred_at": occurred_at,
        "idempotency": {"event_id": event.idempotency_key or event.event_id},
    }
    if account_id is not None:
        result["account_id"] = account_id
    if company_id is not None:
        result["company_id"] = company_id
    if data.get('currency'):
        result["currency"] = data.get('currency')

    return result


def format_vault_payload_bank_reconciliation_confirmation(event: OutboxEvent) -> dict | None:
    """Format pour POST /api/v1/bank-reconciliation/confirmation-events (SPEC Confirmation Bancaire v1.3).

    Retourne None si impacted_documents vide (événement non éligible à la confirmation).
    """
    payload = event.payload
    data = payload.get('data', {})
    impacted = data.get('impacted_documents') or []
    if not impacted:
        return None

    event_type = payload.get('event_type', 'bank.move.reconciled')
    bank_statement_line_id = int(
        data.get('bank_statement_line_id') or data.get('move_line_id') or data.get('move_id') or 0
    )
    occurred_at = payload.get('timestamp') or data.get('occurred_at') or datetime.now(timezone.utc).isoformat()
    idempotency_key = payload.get('idempotency_key') or event.idempotency_key or event.event_id

    impacted_filtered = [
        {"odoo_model": d.get("odoo_model", ""), "odoo_id": int(d.get("odoo_id", 0)), "amount_abs": float(d.get("amount_abs", 0))}
        for d in impacted
        if d.get("odoo_model") and d.get("odoo_id")
    ]
    if not impacted_filtered:
        return None

    return {
        "tenant": event.tenant,
        "event_type": event_type,
        "bank_statement_line_id": bank_statement_line_id,
        "impacted_documents": impacted_filtered,
        "occurred_at": occurred_at,
        "idempotency_key": idempotency_key,
    }


def format_vault_payload_events(event: OutboxEvent) -> dict:
    """Format fallback pour POST /api/v1/events (types non gérés)."""
    payload = event.payload
    event_type = payload.get('event_type', 'unknown')
    source_str = payload.get('source', '')
    timestamp = payload.get('timestamp', datetime.now(timezone.utc).isoformat())
    data = dict(payload.get('data', {}))

    if 'id' in data and 'source_id' not in data:
        data['source_id'] = str(data['id'])

    source_parts = source_str.split('.')
    source = {
        "unit": source_parts[0] if len(source_parts) > 0 else "unknown",
        "env": source_parts[1] if len(source_parts) > 1 else event.env,
        "tenant": source_parts[2] if len(source_parts) > 2 else event.tenant,
        "component": data.get('component'),
        "connector": "dorevia-vault-connector",
        "version": "1.2.0"
    }

    return {
        "tenant": event.tenant,
        "event_id": event.event_id,
        "idempotency_key": event.idempotency_key,
        "source": source,
        "event_type": event_type,
        "occurred_at": timestamp,
        "payload": data
    }


def format_vault_payload_payroll(event: OutboxEvent) -> dict:
    """Format pour POST /api/v1/payroll (charges de personnel).

    Transforme le payload payroll.charge.posted en format Vault PayrollIngestPayload :
    {name, employee_id, employee_name, total_charges, net_salary, employer_cost,
     currency, date_from, date_to, company_id, idempotency_key}
    """
    payload = event.payload
    data = payload.get('data', {})

    def _extract_id(val):
        if isinstance(val, (int, float)):
            return int(val)
        if isinstance(val, (list, tuple)) and len(val) >= 1:
            return int(val[0])
        if isinstance(val, str) and val.isdigit():
            return int(val)
        return 0

    return {
        "name": data.get('name', ''),
        "employee_id": _extract_id(data.get('employee_id')),
        "employee_name": data.get('employee_name', ''),
        "total_charges": float(data.get('total_charges', 0)),
        "net_salary": float(data.get('net_salary', 0)),
        "employer_cost": float(data.get('employer_cost', 0)),
        "currency": data.get('currency', 'EUR'),
        "date_from": data.get('date_from', ''),
        "date_to": data.get('date_to', ''),
        "company_id": _extract_id(data.get('company_id')),
        "idempotency_key": event.idempotency_key or '',
    }


def format_vault_payload_payment(event: OutboxEvent) -> dict:
    """Format pour POST /api/v1/payments (paiements Odoo).

    Transforme le payload DVIG ingest en format Vault payments :
    {tenant, source_system, source_model, source_id, payment_date (RFC3339),
     amount, currency, method, source, payment_direction, is_refund,
     company_id, payment (JSON brut), idempotency_key}
    """
    payload = event.payload
    data = payload.get('data', {})

    payment_type = data.get('payment_type', '')
    is_inbound = payment_type == 'inbound'

    payment_date = data.get('date', '')
    if payment_date and 'T' not in payment_date:
        payment_date = f"{payment_date}T00:00:00Z"
    erp_event_captured_at = (
        data.get('erp_event_captured_at')
        or payload.get('erp_event_captured_at')
        or payload.get('timestamp')
    )
    dvig_ingested_at = event.created_at.isoformat() + "Z" if event.created_at else None

    return {
        "tenant": event.tenant,
        "source_system": "odoo",
        "source_model": data.get('model', 'account.payment'),
        "source_id": str(data.get('id', '')),
        "payment_date": payment_date,
        "amount": float(data.get('amount', 0)),
        "currency": data.get('currency', 'EUR'),
        "method": data.get('method', 'transfer'),
        "source": "account",
        "payment_direction": "inbound" if is_inbound else "outbound",
        "is_refund": bool(data.get('is_refund', False)),
        "company_id": int(data.get('company_id', 1)),
        "idempotency_key": event.idempotency_key,
        "erp_event_captured_at": erp_event_captured_at,
        "dvig_ingested_at": dvig_ingested_at,
        "payment": {
            "db": data.get('db', ''),
            "id": data.get('id'),
            "name": data.get('name', ''),
            "amount": float(data.get('amount', 0)),
            "currency": data.get('currency', 'EUR'),
            "date": data.get('date', ''),
            "partner_id": data.get('partner_id'),
            "partner_name": data.get('partner_name', ''),
            "memo": data.get('memo', ''),
            "erp_event_captured_at": erp_event_captured_at,
            "dvig_ingested_at": dvig_ingested_at,
        },
    }


# ── Routing ────────────────────────────────────────────────────

def _resolve_vault_endpoint(event: OutboxEvent) -> tuple[str, dict, dict]:
    """Détermine l'URL Vault, le payload et les headers selon l'event_type.

    Routage :
      invoice.posted           → POST /api/v1/invoices  (format invoices, meta.partner_name)
      payment.posted           → POST /api/v1/payments   (format spécialisé)
      payroll.charge.posted    → POST /api/v1/payroll    (charges personnel → documents hr.payslip)
      bank.move.reconciled     → POST /api/v1/bank-reconciliation/events
      bank.move.unreconciled   → POST /api/v1/bank-reconciliation/events
      *                        → POST /api/v1/events     (fallback générique)

    Returns:
        (url, payload, extra_headers)
    """
    vault_base = f"http://{settings.vault_host}:{settings.vault_port}"
    event_type = event.payload.get('event_type', 'unknown')

    if event_type == 'payment.posted':
        url = f"{vault_base}/api/v1/payments"
        payload = format_vault_payload_payment(event)
        extra_headers = {"X-Tenant": event.tenant}
        log.debug("route_payment", event_id=event.event_id, url=url)
        return url, payload, extra_headers

    if event_type == 'invoice.posted':
        url = f"{vault_base}/api/v1/invoices"
        payload = format_vault_payload_invoices(event)
        extra_headers = {"X-Tenant": event.tenant}
        log.debug("route_invoice", event_id=event.event_id, url=url)
        return url, payload, extra_headers

    if event_type == 'payroll.charge.posted':
        url = f"{vault_base}/api/v1/payroll"
        payload = format_vault_payload_payroll(event)
        extra_headers = {"X-Tenant": event.tenant}
        log.debug("route_payroll", event_id=event.event_id, url=url)
        return url, payload, extra_headers

    if event_type in ('bank.move.reconciled', 'bank.move.unreconciled'):
        url = f"{vault_base}/api/v1/bank-reconciliation/events"
        payload = format_vault_payload_bank_reconciliation(event)
        extra_headers = {"X-Tenant": event.tenant}
        log.debug("route_bank_reconciliation", event_id=event.event_id, event_type=event_type, url=url)
        return url, payload, extra_headers

    url = f"{vault_base}/api/v1/events"
    payload = format_vault_payload_events(event)
    extra_headers = {"X-Tenant": event.tenant}
    return url, payload, extra_headers


# ── Forward (trace_id + logs structurés) ────────────────────────

BODY_TRUNCATE_LEN = 2048  # Privacy : max 2048 chars, UTF-8 safe (SPEC v1.0)
COMPONENT, SERVICE = "dvig", "dvig-worker"


def _vault_status_family(status_code: Optional[int] = None, exc: Optional[Exception] = None) -> str:
    """Retourne 2xx|4xx|5xx|timeout|network|exception pour stats rapides."""
    if exc is not None:
        if isinstance(exc, httpx.TimeoutException):
            return "timeout"
        if isinstance(exc, (httpx.ConnectError, httpx.NetworkError)):
            return "network"
        if isinstance(exc, httpx.HTTPStatusError):
            status_code = exc.response.status_code
        else:
            return "exception"
    if status_code is None:
        return "exception"
    if 200 <= status_code < 300:
        return "2xx"
    if 400 <= status_code < 500:
        return "4xx"
    if status_code >= 500:
        return "5xx"
    return "other"


def _error_class_from_exc(e: Exception) -> str:
    """Retourne une classe d'erreur pour les logs."""
    if isinstance(e, httpx.TimeoutException):
        return "timeout"
    if isinstance(e, httpx.HTTPStatusError):
        return f"http_{e.response.status_code}"
    if isinstance(e, (httpx.ConnectError, httpx.NetworkError)):
        return "network_error"
    return f"unknown_{type(e).__name__}"


def _compute_erp_to_vault_ms(event: OutboxEvent) -> Optional[int]:
    payload = event.payload if isinstance(event.payload, dict) else {}
    data = payload.get("data", {}) if isinstance(payload.get("data", {}), dict) else {}
    captured_raw = (
        data.get("erp_event_captured_at")
        or payload.get("erp_event_captured_at")
        or payload.get("timestamp")
    )
    if not captured_raw:
        return None
    try:
        captured_at = datetime.fromisoformat(str(captured_raw).replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        if captured_at.tzinfo is None:
            captured_at = captured_at.replace(tzinfo=timezone.utc)
        return int((now - captured_at).total_seconds() * 1000)
    except Exception:
        return None


async def forward_to_vault(event: OutboxEvent) -> Tuple[dict, str]:
    """Envoie un événement vers le bon endpoint Vault.
    Génère trace_id, l'envoie via X-Trace-Id, logs structurés.
    Returns: (response_json, trace_id)
    Raises: httpx.HTTPStatusError ou autre sur échec.
    """
    trace_id = str(uuid_module.uuid4()).lower()  # UUID v4 lowercase (SPEC v1.0)
    url, vault_payload, extra_headers = _resolve_vault_endpoint(event)

    headers = {"Content-Type": "application/json", "X-Trace-Id": trace_id}
    headers.update(extra_headers)

    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=vault_payload,
                timeout=settings.vault_timeout,
                headers=headers,
            )
        duration_ms = int((time.time() - start) * 1000)

        if response.status_code >= 400:
            body_raw = response.text or ""
            body_truncated = body_raw[:BODY_TRUNCATE_LEN] if body_raw else None
            log.warning(
                "vault_forward_non2xx",
                msg_code="vault_forward_non2xx",
                component=COMPONENT,
                service=SERVICE,
                trace_id=trace_id,
                tenant=event.tenant,
                event_id=event.event_id,
                attempt_count=event.attempt_count,
                target_url=url,
                http_status=response.status_code,
                vault_status_family=_vault_status_family(response.status_code),
                duration_ms=duration_ms,
                error_class=f"http_{response.status_code}",
                response_size_bytes=len(body_raw),
                body_truncated=body_truncated,
            )
            response.raise_for_status()

        # Confirmation Bancaire v1.3 : second POST vers confirmation si impacted_documents
        event_type = event.payload.get('event_type', '')
        if event_type in ('bank.move.reconciled', 'bank.move.unreconciled'):
            conf_payload = format_vault_payload_bank_reconciliation_confirmation(event)
            if conf_payload:
                vault_base = f"http://{settings.vault_host}:{settings.vault_port}"
                conf_url = f"{vault_base}/api/v1/bank-reconciliation/confirmation-events"
                conf_headers = {"X-Tenant": event.tenant}
                headers_conf = {**headers, **conf_headers}
                resp_conf = await client.post(
                    conf_url,
                    json=conf_payload,
                    timeout=settings.vault_timeout,
                    headers=headers_conf,
                )
                if resp_conf.status_code >= 400:
                    body_raw = resp_conf.text or ""
                    log.warning(
                        "vault_confirmation_non2xx",
                        event_id=event.event_id,
                        conf_url=conf_url,
                        http_status=resp_conf.status_code,
                        body=body_raw[:BODY_TRUNCATE_LEN],
                    )
                    resp_conf.raise_for_status()
                log.debug("vault_confirmation_ok", event_id=event.event_id)

        log.info(
            "vault_forward_ok",
            msg_code="vault_forward_ok",
            component=COMPONENT,
            service=SERVICE,
            trace_id=trace_id,
            tenant=event.tenant,
            event_id=event.event_id,
            attempt_count=event.attempt_count,
            target_url=url,
            http_status=response.status_code,
            vault_status_family="2xx",
            duration_ms=duration_ms,
        )
        return response.json(), trace_id

    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        err_class = _error_class_from_exc(e)
        status_family = _vault_status_family(None, e)
        body_truncated = None
        response_size_bytes = None
        http_status = None
        if isinstance(e, httpx.HTTPStatusError):
            http_status = e.response.status_code
            body_raw = e.response.text or ""
            response_size_bytes = len(body_raw)
            body_truncated = body_raw[:BODY_TRUNCATE_LEN] if body_raw else None
        log.warning(
            "vault_forward_error",
            msg_code="vault_forward_error",
            component=COMPONENT,
            service=SERVICE,
            trace_id=trace_id,
            tenant=event.tenant,
            event_id=event.event_id,
            attempt_count=event.attempt_count,
            target_url=url,
            http_status=http_status,
            vault_status_family=status_family,
            duration_ms=duration_ms,
            error_class=err_class,
            error=str(e)[:500],
            response_size_bytes=response_size_bytes,
            body_truncated=body_truncated,
        )
        raise


# ── Patch odoo_id (post-forward) ───────────────────────────────

def _patch_vault_odoo_id(db: Session, event: OutboxEvent, vault_doc_id: Optional[str]):
    """Met à jour odoo_id dans la table documents de Vault après forwarding.

    /api/v1/events ne propage pas odoo_id depuis le payload.
    Le worker corrige cela en UPDATE directe sur la même DB partagée.
    """
    if not vault_doc_id:
        return
    payload = event.payload if isinstance(event.payload, dict) else {}
    data = payload.get('data', {})
    odoo_id = data.get('id')
    if not odoo_id:
        return
    try:
        from sqlalchemy import text
        db.execute(
            text("UPDATE documents SET odoo_id = :odoo_id WHERE id = :doc_id AND odoo_id IS NULL"),
            {"odoo_id": int(odoo_id), "doc_id": vault_doc_id}
        )
        db.commit()
        log.debug("patch_vault_odoo_id", vault_doc_id=vault_doc_id, odoo_id=odoo_id)
    except Exception as e:
        log.warning("patch_vault_odoo_id_error", vault_doc_id=vault_doc_id, error=str(e))
        try:
            db.rollback()  # Éviter Session aborted — documents est dans Vault DB, pas DVIG DB
        except Exception:
            pass


# ── Process ────────────────────────────────────────────────────

async def process_event(db: Session, event: OutboxEvent) -> bool:
    try:
        update_event_status(db, event, status='forwarding')
        increment_attempt_count(db, event)

        start_time = time.time()
        vault_response, trace_id = await forward_to_vault(event)
        duration = time.time() - start_time

        vault_id = vault_response.get('vault_id') or vault_response.get('id')
        update_event_status(
            db, event,
            status='forwarded',
            vault_receipt_id=vault_id
        )

        _patch_vault_odoo_id(db, event, vault_id)

        if METRICS_AVAILABLE:
            record_forward_success(event.tenant, event.env)
            record_forward_duration(event.tenant, event.env, duration)
        erp_to_vault_ms = _compute_erp_to_vault_ms(event)
        if METRICS_AVAILABLE and erp_to_vault_ms is not None and erp_to_vault_ms >= 0:
            record_erp_to_vault_duration(event.tenant, event.env, erp_to_vault_ms / 1000.0)

        log.info(
            "outbox_event_forwarded",
            event_id=event.event_id,
            trace_id=trace_id,
            idempotency_key=event.idempotency_key,
            tenant=event.tenant,
            env=event.env,
            attempt_count=event.attempt_count,
            vault_id=vault_id,
            duration_seconds=duration,
            erp_to_vault_ms=erp_to_vault_ms,
            route=event.payload.get('event_type', 'unknown'),
        )
        return True

    except Exception as e:
        error_type, is_soft = classify_error(e)
        error_message = str(e)

        if is_soft:
            next_retry = calculate_next_retry(event.attempt_count)
            update_event_status(
                db, event,
                status='failed_soft',
                last_error=error_message,
                next_retry_at=next_retry
            )
            if METRICS_AVAILABLE:
                record_forward_failed_soft(event.tenant, event.env, error_type)
            log.warning(
                "outbox_event_failed_soft",
                event_id=event.event_id,
                idempotency_key=event.idempotency_key,
                tenant=event.tenant,
                env=event.env,
                attempt_count=event.attempt_count,
                error_type=error_type,
                error_message=error_message,
                next_retry_at=next_retry.isoformat()
            )
        else:
            update_event_status(
                db, event,
                status='failed_hard',
                last_error=error_message
            )
            if METRICS_AVAILABLE:
                record_forward_failed_hard(event.tenant, event.env, error_type)
            log.error(
                "outbox_event_failed_hard",
                event_id=event.event_id,
                idempotency_key=event.idempotency_key,
                tenant=event.tenant,
                env=event.env,
                attempt_count=event.attempt_count,
                error_type=error_type,
                error_message=error_message
            )
        return False


async def process_outbox_events(limit: int = 50) -> dict:
    db = next(get_db())
    stats = {
        "processed": 0,
        "succeeded": 0,
        "failed_soft": 0,
        "failed_hard": 0,
        "forwarded_source_ids": []
    }

    try:
        events = select_pending_events(db, limit=limit)

        if METRICS_AVAILABLE:
            from collections import defaultdict
            backlog_counts = defaultdict(int)
            for e in events:
                backlog_counts[(e.tenant, e.env)] += 1
            for (tenant, env), count in backlog_counts.items():
                update_outbox_backlog(tenant, env, count)

        log.info(
            "outbox_worker_start",
            events_count=len(events),
            limit=limit
        )

        for event in events:
            try:
                success = await process_event(db, event)
                stats["processed"] += 1

                if success:
                    stats["succeeded"] += 1
                    try:
                        payload = event.payload if isinstance(event.payload, dict) else {}
                        data = payload.get('data', {})
                        model = data.get('model', 'unknown')
                        record_id = str(data.get('id', 'unknown'))

                        if model != 'unknown' and record_id != 'unknown':
                            model_normalized = model.replace('.', '_')
                            source_id = f"{model_normalized}:{record_id}"
                            stats["forwarded_source_ids"].append(source_id)
                    except Exception as e:
                        log.warning(
                            "outbox_worker_source_id_error",
                            event_id=event.event_id,
                            error=str(e)
                        )
                else:
                    db.refresh(event)
                    if event.status == 'failed_soft':
                        stats["failed_soft"] += 1
                    elif event.status == 'failed_hard':
                        stats["failed_hard"] += 1

            except Exception as e:
                log.error(
                    "outbox_worker_event_error",
                    event_id=event.event_id,
                    error=str(e)
                )
                stats["processed"] += 1
                stats["failed_hard"] += 1

        log.info(
            "outbox_worker_complete",
            **{k: v for k, v in stats.items() if k != "forwarded_source_ids"},
            forwarded_count=len(stats["forwarded_source_ids"])
        )

    except Exception as e:
        log.error(
            "outbox_worker_error",
            error=str(e)
        )
    finally:
        db.close()

    return stats


def run_worker_sync(limit: int = 50) -> dict:
    import asyncio
    return asyncio.run(process_outbox_events(limit=limit))
