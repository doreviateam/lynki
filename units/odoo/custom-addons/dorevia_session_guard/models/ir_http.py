# -*- coding: utf-8 -*-
# Part of Dorevia. See LICENSE file.

import logging

from werkzeug.wrappers import Response

from odoo import models
from odoo.http import request

_logger = logging.getLogger(__name__)

COOKIE_NAME = 'dorevia_linky'
COOKIE_VALUE = '1'
COOKIE_MAX_AGE = 2592000  # 30 jours


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    @classmethod
    def _dispatch(cls, endpoint):
        response = super()._dispatch(endpoint)

        if not isinstance(response, Response) or response.mimetype != 'text/html':
            return response

        req = request
        uid = getattr(req, 'session', None) and getattr(req.session, 'uid', None)
        if not uid:
            return response

        try:
            user = req.env['res.users'].browse(uid)
            if user.exists() and user.has_group(
                'dorevia_session_guard.group_linky_users'
            ):
                cls._set_linky_cookie(response)
        except Exception:
            pass

        return response

    @classmethod
    def _set_linky_cookie(cls, response):
        """Pose le cookie dorevia_linky sur une Response HTML."""
        cookie_domain = cls._get_cookie_domain()
        cookie_value = f'{COOKIE_NAME}={COOKIE_VALUE}; Path=/; Max-Age={COOKIE_MAX_AGE}; Secure; HttpOnly; SameSite=Lax'
        if cookie_domain:
            cookie_value += f'; Domain={cookie_domain}'
        response.headers.add('Set-Cookie', cookie_value)

    @classmethod
    def _clear_linky_cookie(cls, response):
        """Supprime le cookie dorevia_linky."""
        cookie_domain = cls._get_cookie_domain()
        clear_value = f'{COOKIE_NAME}=; Path=/; Max-Age=0'
        if cookie_domain:
            clear_value += f'; Domain={cookie_domain}'
        response.headers.add('Set-Cookie', clear_value)

    @classmethod
    def _get_cookie_domain(cls):
        req = request
        env = getattr(req, 'env', None)
        if not env:
            return ''
        param = env['ir.config_parameter'].sudo().get_param(
            'dorevia_session_guard.cookie_domain', ''
        )
        return (param or '').strip()
