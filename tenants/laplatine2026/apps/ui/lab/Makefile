# Déploiement lab Linky — hash « UI · … » = commit git courant.
# Même effet que ./scripts/deploy-linky-lab.sh (linky_generic + linky_lab_laplatine2026).
.PHONY: deploy linky
deploy linky:
	@ROOT="$$(git -C "$(CURDIR)" rev-parse --show-toplevel)"; \
	exec "$$ROOT/scripts/deploy-linky-lab.sh"
