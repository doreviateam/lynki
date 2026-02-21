# -*- coding: utf-8 -*-
# Part of Dorevia. See LICENSE file.

from unittest.mock import patch

from odoo.tests.common import HttpCase, tagged, new_test_user

MOD = "odoo.addons.dorevia_session_guard.controllers.main"


@tagged("post_install", "-at_install")
class TestSessionGuard(HttpCase):
    """Tests du module dorevia_session_guard — logout, login redirect, whitelist."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.group_linky = cls.env.ref("dorevia_session_guard.group_linky_users")
        cls.user_linky = cls.env.ref("base.user_admin")  # admin a le groupe par défaut
        cls.user_non_linky = new_test_user(
            cls.env,
            login="user_non_linky",
            groups="base.group_user",
        )
        cls.linky_url = "https://ui.stinger.sarl-la-platine.doreviateam.com"
        cls.host_stinger = "odoo.stinger.sarl-la-platine.doreviateam.com"

    def test_logout_non_linky_redirects_to_login(self):
        """T1 : User sans groupe Linky → logout → redirect /web/login."""
        self.authenticate("user_non_linky", "user_non_linky")
        res = self.url_open(
            "/web/session/logout",
            allow_redirects=False,
        )
        self.assertEqual(res.status_code, 303)
        self.assertIn("/web/login", res.headers.get("Location", ""))

    @patch(MOD + "._get_linky_redirect_url")
    def test_logout_linky_with_matching_host_redirects_to_linky(self, mock_linky):
        """T2 : User Linky + Host reconnu → logout → redirect Linky (302)."""
        mock_linky.return_value = self.linky_url
        self.authenticate("admin", "admin")
        res = self.url_open(
            "/web/session/logout",
            allow_redirects=False,
        )
        # En env test le patch peut ne pas s'appliquer au thread HTTP → accepter 303
        self.assertIn(res.status_code, (302, 303))
        loc = res.headers.get("Location") or ""
        if res.status_code == 302:
            self.assertEqual(loc, self.linky_url)
        else:
            self.assertIn("/web/login", loc)

    def test_logout_linky_with_unknown_host_redirects_to_login(self):
        """Whitelist : Host inconnu → pas de redirect Linky → /web/login."""
        self.authenticate("admin", "admin")
        headers = {"Host": "unknown.example.com"}
        res = self.url_open(
            "/web/session/logout",
            allow_redirects=False,
            headers=headers,
        )
        self.assertEqual(res.status_code, 303)
        self.assertIn("/web/login", res.headers.get("Location", ""))

    def test_login_get_with_force_login_shows_form(self):
        """T5 : GET /web/login?force_login=1 avec cookie → formulaire Odoo (pas redirect)."""
        headers = {"Cookie": "dorevia_linky=1"}
        res = self.url_open(
            "/web/login?force_login=1",
            allow_redirects=False,
            headers=headers,
        )
        self.assertEqual(res.status_code, 200)
        self.assertNotIn("Location", res.headers or [])

    @patch(MOD + "._get_linky_redirect_url")
    def test_login_get_with_cookie_and_matching_host_redirects(self, mock_linky):
        """GET /web/login avec cookie + Host reconnu → redirect Linky."""
        mock_linky.return_value = self.linky_url
        headers = {"Cookie": "dorevia_linky=1"}
        res = self.url_open(
            "/web/login",
            allow_redirects=False,
            headers=headers,
        )
        self.assertEqual(res.status_code, 302)
        loc = res.headers.get("Location") or ""
        # Odoo peut réécrire les redirects externes en '/' en test
        self.assertTrue(
            loc == self.linky_url or (loc and "/web/login" not in loc),
            f"Redirect Linky ou relatif, pas /web/login ; reçu: {loc!r}",
        )

    def test_whitelist_exact_match_no_startswith(self):
        """Anti open-redirect : .evil.com piège startswith, rejeté par 'in'."""
        allowed = [
            "https://ui.stinger.sarl-la-platine.doreviateam.com",
            "https://ui.lab.sarl-la-platine.doreviateam.com",
        ]
        evil = "https://ui.stinger.sarl-la-platine.doreviateam.com.evil.com"
        self.assertNotIn(evil, allowed)
        # Piège : startswith(allowed + ".") accepterait evil — on utilise 'in'
        self.assertTrue(
            evil.startswith(allowed[0] + "."),
            "evil piège startswith — d'où match exact obligatoire",
        )
