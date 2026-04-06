# -*- coding: utf-8 -*-
"""Fusion des comptes doublons par société, puis retrait de l’ancienne contrainte d’unicité."""

import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    cr.execute(
        """
        SELECT company_id
        FROM dorevia_helloasso_account
        WHERE company_id IS NOT NULL
        GROUP BY company_id
        HAVING COUNT(*) > 1
        """
    )
    for (cid,) in cr.fetchall():
        cr.execute(
            """
            SELECT id FROM dorevia_helloasso_account
            WHERE company_id = %s
            ORDER BY
              CASE WHEN NULLIF(TRIM(client_id), '') IS NOT NULL THEN 0 ELSE 1 END,
              sequence,
              id
            """,
            (cid,),
        )
        ids = [r[0] for r in cr.fetchall()]
        if len(ids) <= 1:
            continue
        keep_id = ids[0]
        for rid in ids[1:]:
            _logger.warning(
                "pre-migrate HelloAsso : suppression compte doublon id=%s (company_id=%s), conservation id=%s",
                rid,
                cid,
                keep_id,
            )
            cr.execute(
                "DELETE FROM dorevia_helloasso_account WHERE id = %s",
                (rid,),
            )

    cr.execute(
        """
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'dorevia_helloasso_account'
          AND c.contype = 'u'
          AND pg_get_constraintdef(c.oid) LIKE '%%organization_slug%%'
        """
    )
    for (cname,) in cr.fetchall():
        cr.execute(
            'ALTER TABLE dorevia_helloasso_account DROP CONSTRAINT IF EXISTS "%s"'
            % cname.replace('"', "")
        )
