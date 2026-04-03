# -*- coding: utf-8 -*-
"""Client HTTP HelloAsso (OAuth2 + API v5) — REF_API §2.2, §2.4."""

import logging
from urllib.parse import quote

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


def sanitize_pagination_total(raw):
    """
    HelloAsso renvoie parfois totalCount = -1 lorsque le total global n'est pas calculé.
    Dans ce cas on retourne None pour forcer l'UI à se rabattre sur le nombre d'éléments
    retournés dans ``data``.
    """
    if raw is None:
        return None
    try:
        n = int(raw)
    except (TypeError, ValueError):
        return None
    if n < 0:
        return None
    return n


def _items_and_total_from_v5_body(body):
    """
    Extrait (liste data, totalCount ou None) depuis une enveloppe v5 type
    ResultsWithPaginationModel (champs camelCase ou PascalCase).
    """
    if not isinstance(body, dict):
        return None, None
    # Ne pas utiliser « or » entre data/Data : JSON `"data": null` doit donner [].
    raw = body.get("data")
    if raw is None:
        raw = body.get("Data")
    if isinstance(raw, list):
        items = raw
    elif raw is None:
        items = []
    else:
        items = None
    pag = body.get("pagination") or body.get("Pagination")
    total = None
    if isinstance(pag, dict):
        total = pag.get("totalCount")
        if total is None:
            total = pag.get("TotalCount")
    return items, sanitize_pagination_total(total)


def _raise_for_status(path_label, status_code, body):
    if status_code == 200:
        return
    hint = ""
    if isinstance(body, dict):
        hint = body.get("message") or body.get("Message") or ""
    if not hint and isinstance(body, dict):
        errs = body.get("errors") or body.get("Errors")
        if isinstance(errs, list) and errs:
            hint = str(errs[0])
    if not hint and body:
        hint = _shorten(str(body), 280)
    msg = f"{path_label} refusé (HTTP {status_code})."
    if hint:
        msg += f" {hint}"
    raise HelloAssoClientError(msg)


def fetch_organization_forms(
    organization_slug,
    access_token,
    use_sandbox,
    form_types=None,
    page_index=1,
    page_size=50,
    timeout=25,
):
    """
    GET /v5/organizations/{slug}/forms — liste paginée (AccessPublicData).

    form_types : ex. [\"Membership\"] pour filtrer ; None = pas de filtre type.
    Retourne (items, total_count_optionnel).
    """
    slug = (organization_slug or "").strip()
    if not slug:
        return None, None

    base = api_v5_base(use_sandbox)
    url = f"{base}/organizations/{quote(slug, safe='')}/forms"
    params = [("pageIndex", page_index), ("pageSize", page_size)]
    if form_types:
        for ft in form_types:
            params.append(("formTypes", ft))

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=timeout)
    except requests.exceptions.Timeout as e:
        raise HelloAssoClientError(
            "Délai dépassé lors de la liste des formulaires. Réessayez."
        ) from e
    except requests.exceptions.RequestException as e:
        raise HelloAssoClientError(f"Erreur réseau (formulaires) : {_shorten(str(e))}") from e

    try:
        body = resp.json()
    except ValueError:
        body = None

    _raise_for_status("Liste des formulaires", resp.status_code, body)
    items, total = _items_and_total_from_v5_body(body)
    return items, total


def fetch_form_orders_page(
    organization_slug,
    form_type,
    form_slug,
    access_token,
    use_sandbox,
    page_index=1,
    page_size=1,
    timeout=25,
):
    """
    GET …/forms/{formType}/{formSlug}/orders — FormAdmin / OrganizationAdmin + AccessTransactions.
    Retourne (items_première_page, total_count_sur_toutes_pages_ou_None).
    """
    org = (organization_slug or "").strip()
    ft = (form_type or "").strip()
    fs = (form_slug or "").strip()
    if not org or not ft or not fs:
        return None, None

    base = api_v5_base(use_sandbox)
    path = (
        f"/organizations/{quote(org, safe='')}/forms/"
        f"{quote(ft, safe='')}/{quote(fs, safe='')}/orders"
    )
    url = f"{base}{path}"
    params = [("pageIndex", page_index), ("pageSize", page_size)]

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=timeout)
    except requests.exceptions.Timeout as e:
        raise HelloAssoClientError("Délai dépassé (commandes formulaire).") from e
    except requests.exceptions.RequestException as e:
        raise HelloAssoClientError(f"Erreur réseau (commandes) : {_shorten(str(e))}") from e

    try:
        body = resp.json()
    except ValueError:
        body = None

    if resp.status_code != 200:
        _raise_for_status("Lecture des commandes", resp.status_code, body)

    items, total = _items_and_total_from_v5_body(body)
    return items, total


def fetch_form_payments_page(
    organization_slug,
    form_type,
    form_slug,
    access_token,
    use_sandbox,
    page_index=1,
    page_size=1,
    timeout=25,
):
    """GET …/forms/{formType}/{formSlug}/payments — mêmes rôles / privilèges que les commandes."""
    org = (organization_slug or "").strip()
    ft = (form_type or "").strip()
    fs = (form_slug or "").strip()
    if not org or not ft or not fs:
        return None, None

    base = api_v5_base(use_sandbox)
    path = (
        f"/organizations/{quote(org, safe='')}/forms/"
        f"{quote(ft, safe='')}/{quote(fs, safe='')}/payments"
    )
    url = f"{base}{path}"
    params = [("pageIndex", page_index), ("pageSize", page_size)]

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=timeout)
    except requests.exceptions.Timeout as e:
        raise HelloAssoClientError("Délai dépassé (paiements formulaire).") from e
    except requests.exceptions.RequestException as e:
        raise HelloAssoClientError(f"Erreur réseau (paiements) : {_shorten(str(e))}") from e

    try:
        body = resp.json()
    except ValueError:
        body = None

    if resp.status_code != 200:
        _raise_for_status("Lecture des paiements", resp.status_code, body)

    items, total = _items_and_total_from_v5_body(body)
    return items, total


def form_light_form_type_str(item):
    """Valeur formType depuis un FormLight (string ou enum JSON)."""
    if not isinstance(item, dict):
        return ""
    raw = item.get("formType") or item.get("FormType")
    if raw is None:
        return ""
    if isinstance(raw, str):
        return raw.strip()
    if isinstance(raw, dict):
        return str(raw.get("name") or raw.get("Name") or raw.get("value") or "")
    return str(raw)


def form_light_slug(item):
    if not isinstance(item, dict):
        return ""
    return (item.get("formSlug") or item.get("FormSlug") or "").strip()


def form_light_title(item):
    if not isinstance(item, dict):
        return ""
    return (item.get("title") or item.get("Title") or item.get("privateTitle") or "").strip()


def pick_first_membership_form(forms_list):
    """Premier formulaire dont le type est Membership (insensible à la casse)."""
    if not forms_list:
        return None
    for form in forms_list:
        ft = form_light_form_type_str(form)
        if ft and ft.lower() == "membership":
            return form
    return None


def order_or_payment_trace_ids(sample_item):
    """Identifiants candidats pour traçabilité depuis un objet commande ou paiement."""
    if not isinstance(sample_item, dict):
        return []
    keys = (
        "id",
        "Id",
        "orderId",
        "OrderId",
        "paymentId",
        "PaymentId",
        "reference",
        "Reference",
        "orderNumber",
        "OrderNumber",
    )
    out = []
    for k in keys:
        v = sample_item.get(k)
        if v is not None and v != "":
            out.append(f"{k}={v}")
            if len(out) >= 2:
                break
    return out
