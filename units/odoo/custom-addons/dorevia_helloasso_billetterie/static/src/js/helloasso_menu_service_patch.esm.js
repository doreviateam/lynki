/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { menuService } from "@web/webclient/menus/menu_service";

/**
 * 1) Utiliser actionPath quand présent (résolution stable côté /web/action/load).
 * 2) Ne pas exiger actionID seul : certains caches client peuvent omettre l’id mais garder le path.
 */
patch(menuService, {
    async start(env) {
        const api = await super.start(...arguments);
        const setCurrentMenu = api.setCurrentMenu.bind(api);
        api.selectMenu = async function (menu) {
            menu = typeof menu === "number" ? this.getMenu(menu) : menu;
            const actionRef = menu.actionPath || menu.actionID;
            if (!actionRef) {
                return;
            }
            await env.services.action.doAction(actionRef, {
                clearBreadcrumbs: true,
                onActionReady: () => {
                    setCurrentMenu(menu);
                },
            });
        };
        return api;
    },
});
