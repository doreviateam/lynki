#!/usr/bin/env python3
"""
Mesure SLA ERP event captured -> Vault sealed (tenant o19).

Principe:
- lit DVIG outbox_events (captured_at + idempotency_key)
- lit Vault documents (created_at + idempotency_key)
- join par idempotency_key
- calcule P50/P95/P99 en millisecondes
"""

from __future__ import annotations

import argparse
import statistics
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List


@dataclass
class LatencySample:
    idempotency_key: str
    captured_at: datetime
    sealed_at: datetime

    @property
    def latency_ms(self) -> float:
        return (self.sealed_at - self.captured_at).total_seconds() * 1000.0


def _run(command: str) -> List[str]:
    out = subprocess.check_output(command, shell=True, text=True)
    return [line.strip() for line in out.splitlines() if line.strip()]


def _parse_dt(raw: str) -> datetime:
    value = raw.strip()
    if value.endswith("Z"):
        value = value.replace("Z", "+00:00")
    if " " in value and "+" not in value and "T" not in value:
        value = value.replace(" ", "T") + "+00:00"
    if "T" in value and "+" not in value and not value.endswith("Z"):
        value = value + "+00:00"
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _percentile(sorted_values: List[float], p: float) -> float:
    if not sorted_values:
        raise ValueError("empty values")
    if len(sorted_values) == 1:
        return sorted_values[0]
    k = (len(sorted_values) - 1) * p
    f = int(k)
    c = min(f + 1, len(sorted_values) - 1)
    if f == c:
        return sorted_values[f]
    return sorted_values[f] + (sorted_values[c] - sorted_values[f]) * (k - f)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tenant", default="o19")
    parser.add_argument("--limit", type=int, default=500)
    parser.add_argument("--min-payment-id", type=int, default=None)
    parser.add_argument("--max-payment-id", type=int, default=None)
    args = parser.parse_args()

    id_filter = ""
    if args.min_payment_id is not None and args.max_payment_id is not None:
        id_filter = (
            f" AND (payload->'data'->>'id')::int BETWEEN {args.min_payment_id} "
            f"AND {args.max_payment_id} "
        )

    dvig_query = (
        "docker exec dvig-db-core-stinger psql -U dvig_user -d dvig_db -t -A -F'|' "
        f"-c \"SELECT idempotency_key, payload->'data'->>'erp_event_captured_at' AS captured_at "
        "FROM outbox_events "
        f"WHERE tenant='{args.tenant}' "
        "AND payload->>'event_type'='payment.posted' "
        "AND idempotency_key ~ '^[0-9a-f]{64}$' "
        f"{id_filter}"
        f"ORDER BY created_at DESC LIMIT {args.limit};\""
    )
    vault_query = (
        "docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -t -A -F'|' "
        f"-c \"SELECT idempotency_key, created_at "
        "FROM documents "
        f"WHERE tenant='{args.tenant}' "
        "AND odoo_model='account.payment' "
        "AND idempotency_key IS NOT NULL;\""
    )

    dvig_rows = _run(dvig_query)
    vault_rows = _run(vault_query)

    vault_by_key: Dict[str, datetime] = {}
    for row in vault_rows:
        key, created_at = row.split("|", 1)
        vault_by_key[key] = _parse_dt(created_at)

    samples: List[LatencySample] = []
    for row in dvig_rows:
        parts = row.split("|")
        if len(parts) < 2:
            continue
        key, captured_at = parts[0], parts[1]
        if not captured_at:
            continue
        sealed_at = vault_by_key.get(key)
        if sealed_at is None:
            continue
        try:
            sample = LatencySample(
                idempotency_key=key,
                captured_at=_parse_dt(captured_at),
                sealed_at=sealed_at,
            )
            if sample.latency_ms >= 0:
                samples.append(sample)
        except Exception:
            continue

    if not samples:
        print("NO_DATA")
        return 2

    values = sorted(s.latency_ms for s in samples)
    print(f"TENANT {args.tenant}")
    print(f"SAMPLES {len(values)}")
    print(f"P50_MS {round(_percentile(values, 0.50), 2)}")
    print(f"P95_MS {round(_percentile(values, 0.95), 2)}")
    print(f"P99_MS {round(_percentile(values, 0.99), 2)}")
    print(f"MIN_MS {round(min(values), 2)}")
    print(f"MAX_MS {round(max(values), 2)}")
    print(f"MEAN_MS {round(statistics.fmean(values), 2)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
