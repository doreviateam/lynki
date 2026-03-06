# -*- coding: utf-8 -*-
# Part of Dorevia. See LICENSE file.

"""Tests du module dorevia_session_guard — logout, cookie, redirect Linky."""

from odoo.tests.common import HttpCase, tagged, new_test_user


@tagged("post_install", "-at_install")
class TestSessionGuardLogout(HttpCase):
    """Tests du contrôleur logout /web/session/logout."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.group_linky = cls.env.ref("dorevia_session_guard.group_linky_users")
        cls.user_linky = cls.env.ref("base.user_admin")
        cls.user_non_linky = new_test_user(
            cls.env,
            login="user_non_linky",
            groups="base.group_user",
        )
        cls.linky_url = "https://ui.lab.sarl-la-platine.doreviateam.com"

    def test_logout_non_linky_redirects_to_login(self):
        """Utilisateur non-Linky → redirect 303 vers /web/login."""
        self.authenticate("user_non_linky", "user_non_linky")
        res = self.url_open("/web/session/logout", allow_redirects=False)
        self.assertEqual(res.status_code, 303)
        self.assertIn("/web/login", res.headers.get("Location", ""))

    def test_logout_linky_redirects_to_linky(self):
        """Utilisateur Linky (admin) → redirect 302 vers URL Linky (logout_linky_url)."""
        self.authenticate("admin", "admin")
        res = self.url_open("/web/session/logout", allow_redirects=False)
        self.assertEqual(res.status_code, 302)
        loc = res.headers.get("Location", "")
        self.assertIn(
            self.linky_url,
            loc,
            f"Attendu redirect vers {self.linky_url}, reçu: {loc}",
        )

    def test_logout_with_cookie_redirects_to_linky(self):
        """Utilisateur non-Linky avec cookie dorevia_linky → redirect vers Linky."""
        self.authenticate("user_non_linky", "user_non_linky")
        headers = {"Cookie": "dorevia_linky=1"}
        res = self.url_open(
            "/web/session/logout",
            allow_redirects=False,
            headers=headers,
        )
        self.assertEqual(res.status_code, 302)
        self.assertIn(self.linky_url, res.headers.get("Location", ""))

    def test_logout_clears_linky_cookie(self):
        """Le logout doit inclure Set-Cookie pour supprimer dorevia_linky."""
        self.authenticate("admin", "admin")
        res = self.url_open("/web/session/logout", allow_redirects=False)
        set_cookie = res.headers.get("Set-Cookie", "")
        self.assertIn(
            "dorevia_linky",
            set_cookie,
            "Set-Cookie pour supprimer dorevia_linky attendu",
        )
        self.assertIn("Max-Age=0", set_cookie, "Cookie clear doit avoir Max-Age=0")


@tagged("post_install", "-at_install")
class TestSessionGuardLogin(HttpCase):
    """Tests de la route /web/login."""

    def test_login_get_shows_form(self):
        """GET /web/login sans session → formulaire Odoo (200)."""
        res = self.url_open("/web/login", allow_redirects=False)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"login", res.content.lower())

    def test_login_with_cookie_shows_form_no_redirect(self):
        """GET /web/login avec cookie dorevia_linky → pas de redirect vers Linky."""
        headers = {"Cookie": "dorevia_linky=1"}
        res = self.url_open(
            "/web/login",
            allow_redirects=False,
            headers=headers,
        )
        self.assertEqual(res.status_code, 200)
        self.assertNotIn("Location", res.headers or [])


@tagged("post_install", "-at_install")
class TestSessionGuardCookie(HttpCase):
    """Tests du cookie dorevia_linky posé par ir_http."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user_linky = cls.env.ref("base.user_admin")
        cls.user_non_linky = new_test_user(
            cls.env,
            login="user_non_linky",
            groups="base.group_user",
        )

    def test_linky_user_gets_cookie_on_web(self):
        """Utilisateur Linky visitant /web → réponse contient Set-Cookie dorevia_linky."""
        self.authenticate("admin", "admin")
        res = self.url_open("/web", allow_redirects=False)
        set_cookie = res.headers.get("Set-Cookie", "")
        self.assertIn("dorevia_linky=1", set_cookie)

    def test_non_linky_user_no_linky_cookie(self):
        """Utilisateur non-Linky → pas de cookie dorevia_linky."""
        self.authenticate("user_non_linky", "user_non_linky")
        res = self.url_open("/web", allow_redirects=False)
        set_cookie = res.headers.get("Set-Cookie", "")
        self.assertNotIn(
            "dorevia_linky",
            set_cookie,
            "Utilisateur non-Linky ne doit pas recevoir cookie dorevia_linky",
        )
