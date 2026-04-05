# -*- coding: utf-8 -*-
"""Libellés métier pour valeurs brutes renvoyées par HelloAsso (listes / fiches)."""

from odoo import _


def form_type_label_for_display(form_type):
    """Traduit les types d’API courants ; laisse la valeur telle quelle si inconnue."""
    if not form_type:
        return ""
    key = (form_type or "").strip().lower()
    mapping = {
        "event": _("Événement"),
        "membership": _("Adhésion"),
        "donation": _("Don"),
        "crowdfunding": _("Financement participatif"),
        "shop": _("Boutique"),
    }
    return mapping.get(key, form_type)
