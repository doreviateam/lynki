# -*- coding: utf-8 -*-
# Part of Dorevia. See LICENSE file.

import json
import logging

from odoo import http
from odoo.http import request

from odoo.addons.web.controllers import home as web_home
from odoo.addons.web.controllers import session as web_session

_logger = logging.getLogger(__name__)

COOKIE_NAME = 'dorevia_linky'
DEFAULT_LINKY_URLS = [
    "https://ui.lab.sarl-la-platine.doreviateam.com",
]


def _get_allowed_urls(env):
    """Retourne la whitelist des URLs Linky (ir.config_parameter, JSON array)."""
    try:
        val = env['ir.config_parameter'].sudo().get_param(
            'dorevia_session_guard.linky_urls', '[]'
        )
        urls = json.loads(val or '[]')
        return urls if isinstance(urls, list) else DEFAULT_LINKY_URLS
    except (json.JSONDecodeError, TypeError):
        return DEFAULT_LINKY_URLS


def _get_linky_redirect_url(req):
    """
    Retourne l'URL Linky pour la redirection logout.
    1. Si dorevia_session_guard.logout_linky_url est défini et dans la whitelist → utilisé
    2. Sinon mapping host: odoo.{env}.{tenant}... -> https://ui.{env}.{tenant}...
    L'URL doit toujours être dans la whitelist.
    """
    oenv = getattr(req, 'env', None)
    if not oenv:
        return None
    allowed = _get_allowed_urls(oenv)

    # Paramètre prioritaire : URL fixe par tenant (ex. odoo.stinger → ui.lab)
    override = (
        oenv['ir.config_parameter'].sudo().get_param(
            'dorevia_session_guard.logout_linky_url', ''
        ) or ''
    ).strip()
    if override and override in allowed:
        return override

    # Mapping par host
    host = getattr(req, 'httprequest', None) and getattr(
        req.httprequest, 'host', None
    )
    if not host:
        return None
    host = host.split(':')[0].strip().lower()
    if not host.startswith('odoo.'):
        return None
    target = 'https://ui.' + host[5:]  # odoo. -> ui.
    return target if target in allowed else None


class Session(web_session.Session):

    @http.route('/web/session/logout', type='http', auth='none')
    def logout(self, redirect='/web/login'):
        # Capturer état avant logout (session perdue après)
        uid = getattr(request.session, 'uid', None)
        has_cookie = COOKIE_NAME in request.httprequest.cookies
        is_linky = False
        if uid:
            try:
                user = request.env['res.users'].browse(uid)
                is_linky = user.exists() and user.has_group(
                    'dorevia_session_guard.group_linky_users'
                )
            except Exception:
                pass

        request.session.logout(keep_db=True)

        IrHttp = request.env['ir.http']
        target_url = _get_linky_redirect_url(request)

        if (is_linky or has_cookie) and target_url:
            response = request.redirect(target_url, 302)
        else:
            response = request.redirect('/web/login', 303)

        IrHttp._clear_linky_cookie(response)
        return response


class Home(web_home.Home):

    @http.route('/web/login', type='http', auth='none')
    def web_login(self, *args, **kw):
        return super().web_login(*args, **kw)
