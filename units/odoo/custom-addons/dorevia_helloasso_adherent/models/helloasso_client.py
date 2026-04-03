# -*- coding: utf-8 -*-
"""Client HTTP HelloAsso (OAuth2 + API v5) — REF_API §2.2, §2.4."""

import logging

import requests

_logger = logging.getLogger(__name__)

SANDBOX_API_ROOT = "https://api.helloasso-sandbox.com"
PRODUCTION_API_ROOT = "https://api.helloasso.com"
OAUTH_TOKEN_PATH = "/oauth2/token"
API_V5_PREFIX = "/v5"


class HelloAssoClientError(Exception):
    """Erreur d'appel HelloAsso ; le message est destiné à l'affichage utilisateur."""


def _api_root(use_sandbox):
    return SANDBOX_API_ROOT if use_sandbox else PRODUCTION_API_ROOT


def oauth_token_url(use_sandbox):
    return _api_root(use_sandbox) + OAUTH_TOKEN_PATH


def api_v5_base(use_sandbox):
    return _api_root(use_sandbox) + API_V5_PREFIX


def _shorten(text, max_len=400):
    if not text:
        return ""
    text = text.strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def _oauth_error_message(payload):
    if not isinstance(payload, dict):
        return None
    err = payload.get("error") or payload.get("Error")
    desc = payload.get("error_description") or payload.get("ErrorDescription")
    if err and desc:
        return f"{err} — {desc}"
    if err:
        return str(err)
    if desc:
        return str(desc)
    return None


def fetch_client_credentials_token(client_id, client_secret, use_sandbox, timeout=20):
    """
    POST grant_type=client_credentials (usage ponctuel : test connexion ou bootstrap).

    Retourne un dict avec au minimum ``access_token`` (et éventuellement
    ``refresh_token``, ``expires_in``, etc.).
    """
    if not client_id or not client_secret:
        raise HelloAssoClientError(
            "Identifiants manquants : renseignez le client ID et le client secret."
        )
    url = oauth_token_url(use_sandbox)
    data = {
        "grant_type": "client_credentials",
        "client_id": client_id.strip(),
        "client_secret": client_secret.strip(),
    }
    try:
        resp = requests.post(
            url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=timeout,
        )
    except requests.exceptions.Timeout as e:
        _logger.warning("HelloAsso OAuth timeout: %s", e)
        raise HelloAssoClientError(
            "Délai dépassé lors de la demande de jeton. Vérifiez le réseau ou réessayez."
        ) from e
    except requests.exceptions.RequestException as e:
        _logger.warning("HelloAsso OAuth request error: %s", e)
        raise HelloAssoClientError(
            f"Impossible de joindre le serveur HelloAsso : {_shorten(str(e))}"
        ) from e

    try:
        payload = resp.json()
    except ValueError:
        payload = None

    if resp.status_code != 200:
        hint = _oauth_error_message(payload) if payload else None
        raw = resp.text or ""
        if not hint and raw:
            hint = _shorten(raw, 300)
        msg = f"Échec OAuth (HTTP {resp.status_code})."
        if hint:
            msg += f" {hint}"
        raise HelloAssoClientError(msg)

    if not isinstance(payload, dict):
        raise HelloAssoClientError("Réponse OAuth invalide (JSON attendu).")

    token = payload.get("access_token")
    if not token:
        raise HelloAssoClientError(
            "Réponse OAuth sans access_token. Vérifiez les identifiants et l'environnement (sandbox / production)."
        )

    return payload


def fetch_form_types_sample(organization_slug, access_token, use_sandbox, timeout=20):
    """
    GET /v5/organizations/{slug}/formTypes — ping lecture (REF_API §2.4).

    Retourne (liste ou None, message court pour l'UI).
    """
    slug = (organization_slug or "").strip()
    if not slug:
        return None, ""

    url = f"{api_v5_base(use_sandbox)}/organizations/{slug}/formTypes"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=timeout)
    except requests.exceptions.Timeout as e:
        raise HelloAssoClientError(
            "Délai dépassé lors de l'appel formTypes. Réessayez ou vérifiez le slug organisation."
        ) from e
    except requests.exceptions.RequestException as e:
        raise HelloAssoClientError(
            f"Erreur réseau sur formTypes : {_shorten(str(e))}"
        ) from e

    try:
        body = resp.json()
    except ValueError:
        body = None

    if resp.status_code != 200:
        hint = ""
        if isinstance(body, dict):
            hint = body.get("message") or body.get("Message") or ""
        if not hint and resp.text:
            hint = _shorten(resp.text, 280)
        msg = f"Lecture des types de formulaires refusée (HTTP {resp.status_code})."
        if hint:
            msg += f" {hint}"
        raise HelloAssoClientError(msg)

    items = None
    if isinstance(body, list):
        items = body
    elif isinstance(body, dict):
        data = body.get("data") or body.get("Data")
        if isinstance(data, list):
            items = data
        pagination = body.get("pagination") or body.get("Pagination")
        if items is None and isinstance(pagination, dict):
            inner = pagination.get("data") or pagination.get("Data")
            if isinstance(inner, list):
                items = inner

    count = len(items) if items is not None else None
    return items, count


def summarize_form_type_entry(item, index):
    """Une ligne lisible pour une entrée formTypes (formats API variables)."""
    if not isinstance(item, dict):
        return f"[{index}] {item!r}"
    name = item.get("name") or item.get("Name") or item.get("label") or item.get("Label")
    ftype = item.get("type") or item.get("Type") or item.get("formType") or item.get("FormType")
    fid = item.get("id") or item.get("Id")
    parts = []
    if name is not None:
        parts.append(str(name))
    if ftype is not None:
        parts.append(f"type={ftype}")
    if fid is not None:
        parts.append(f"id={fid}")
    if parts:
        return f"[{index}] " + " — ".join(parts)
    return f"[{index}] {item!r}"[:300]
