# -*- coding: utf-8 -*-
"""Interprétation des dates renvoyées par l’API HelloAsso v5 pour les champs ``Datetime`` Odoo.

HelloAsso sérialise souvent en ISO 8601 avec ``T`` et fuseau (ex. ``2026-04-03T00:00:00+02:00``).
``fields.Datetime.to_datetime`` sur une chaîne n’accepte pas ce format en Odoo 19 : il faut
``fromisoformat``, puis UTC naïf comme attendu par l’ORM.
"""

import datetime

from odoo import fields


def parse_helloasso_api_datetime(raw):
    """Retourne une valeur compatible ``fields.Datetime`` ou ``False`` si intraitable."""
    if raw is None:
        return False
    if isinstance(raw, (int, float)):
        try:
            sec = float(raw)
            if sec > 1e12:
                sec = sec / 1000.0
            aware = datetime.datetime.fromtimestamp(sec, tz=datetime.timezone.utc)
            naive_utc = aware.replace(tzinfo=None)
            return fields.Datetime.to_datetime(naive_utc)
        except Exception:
            return False
    if isinstance(raw, datetime.datetime):
        dt = raw
        if dt.tzinfo is not None:
            dt = dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
        try:
            return fields.Datetime.to_datetime(dt)
        except Exception:
            return False
    if isinstance(raw, str):
        s = raw.strip()
        if not s:
            return False
        if "T" in s and len(s) >= 11 and s[4:5] == "-" and s[7:8] == "-":
            try:
                norm = s.replace("Z", "+00:00")
                parsed = datetime.datetime.fromisoformat(norm)
                if parsed.tzinfo is not None:
                    parsed = parsed.astimezone(datetime.timezone.utc).replace(tzinfo=None)
                return fields.Datetime.to_datetime(parsed)
            except ValueError:
                pass
        if len(s) == 10 and s[4:5] == "-" and s[7:8] == "-":
            try:
                return fields.Datetime.to_datetime("%s 12:00:00" % s)
            except Exception:
                pass
    try:
        return fields.Datetime.to_datetime(raw)
    except Exception:
        return False
