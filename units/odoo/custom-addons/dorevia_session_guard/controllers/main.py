# -*- coding: utf-8 -*-
# Part of Dorevia. See LICENSE file.

import json
import logging

from odoo import http
from odoo.http import request

from odoo.addons.web.controllers import home as web_home
from odoo.addons.web.controllers import session as web_session

_logger = logging.getLogger(__name__)

# Whitelist stricte (exact match) — spec §6.7
DEFAULT_LINKY_URLS = [
    'https://ui.stinger.sarl-la-platine.doreviateam.com',
    'https://ui.lab.sarl-la-platine.doreviateam.com',
]

# Mapping Host Odoo → URL Linky — spec §6.6
HOST_TO_LINKY = {
    'odoo.stinger.sarl-la-platine.doreviateam.com': (
        'https://ui.stinger.sarl-la-platine.doreviateam.com'
    ),
    'odoo.lab.sarl-la-platine.doreviateam.com': (
        'https://ui.lab.sarl-la-platine.doreviateam.com'
    ),
}


def _get_allowed_urls():
    """Retourne la liste des URLs Linky autorisées (exact match)."""
    try:
        ICP = request.env['ir.config_parameter'].sudo()
        val = ICP.get_param('dorevia_session_guard.linky_urls', '[]')
        urls = json.loads(val) if isinstance(val, str) else val
        if not urls:
            return DEFAULT_LINKY_URLS
        return list(urls) if isinstance(urls, list) else DEFAULT_LINKY_URLS
    except Exception:
        return DEFAULT_LINKY_URLS


def _get_linky_redirect_url():
    """Détermine l'URL Linky selon le Host Odoo (spec §6.6)."""
    host = request.httprequest.host.split(':')[0].strip()
    target = HOST_TO_LINKY.get(host)
    if not target:
        return None
    allowed = _get_allowed_urls()
    if target in allowed:  # Exact match uniquement — jamais startswith
        return target
    return None


class Session(web_session.Session):

    @http.route('/web/session/logout', type='http', auth='none', readonly=True)
    def logout(self, redirect='/web/login'):
        uid = request.session.uid
        user = request.env.user if uid else None
        is_linky = bool(
            user and user.has_group('dorevia_session_guard.group_linky_users')
        )
        has_cookie = request.httprequest.cookies.get('dorevia_linky') == '1'

        request.session.logout(keep_db=True)

        IrHttp = request.env['ir.http']
        target_url = _get_linky_redirect_url()
        if (is_linky or has_cookie) and target_url:
            response = request.redirect(target_url, 302)
            IrHttp._clear_linky_cookie(response)
            _logger.info(
                'dorevia_session_guard: redirect logout vers Linky (host=%s)',
                request.httprequest.headers.get('Host', ''),
            )
            return response

        response = request.redirect(redirect or '/web/login', 303)
        IrHttp._clear_linky_cookie(response)
        return response


class Home(web_home.Home):

    @http.route('/web/login', type='http', auth='none')
    def web_login(self, *args, **kw):
        if request.httprequest.method == 'GET':
            force_login = kw.get('force_login') == '1' or kw.get(
                'force_login'
            ) == 1
            has_cookie = request.httprequest.cookies.get(
                'dorevia_linky'
            ) == '1'
            if not force_login and has_cookie:
                target_url = _get_linky_redirect_url()
                if target_url:
                    _logger.info(
                        'dorevia_session_guard: redirect /web/login vers Linky'
                    )
                    return request.redirect(target_url, 302)
        return super().web_login(*args, **kw)
