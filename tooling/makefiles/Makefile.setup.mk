###############################################################################
# Makefile.setup: Setup and installation-related targets
###############################################################################
include tooling/makefiles/Makefile.shared.mk

.PHONY: pre check-pnpm check-node install install-core install-pattern-detect update-deps clean

# Run both check-pnpm and check-node in parallel
pre: ## Check both pnpm and node are installed
	$(MAKE) $(MAKE_PARALLEL) check-pnpm check-node

check-pnpm:
	@if ! command -v pnpm >/dev/null 2>&1; then \
		$(call log_error,pnpm is not installed. Please install pnpm before continuing.); \
		exit 1; \
	else \
		$(call log_success,pnpm is installed.); \
	fi

check-node:
	@NODE_VER=$$(node -v | cut -d. -f1 | sed 's/v//'); \
	if [ "$$NODE_VER" != "24" ]; then \
		$(call log_error,Unsupported Node.js version ($$(node -v)). Please use Node.js 24 (found in .nvmrc).); \
		exit 1; \
	else \
		$(call log_success,Node.js 24 detected.); \
	fi

install: check-pnpm check-node ## Install all dependencies (workspace)
	@$(call log_info,Installing all dependencies (pnpm install)...)
	$(PNPM) $(SILENT_PNPM) install
	@$(call log_success,All dependencies installed.)

install-core: check-pnpm ## Install core dependencies only
	@$(call log_info,Installing core dependencies (pnpm --filter @aiready/core install)...)
	$(PNPM) $(SILENT_PNPM) --filter @aiready/core install
	@$(call log_success,Core dependencies installed.)

install-pattern-detect: check-pnpm ## Install pattern-detect dependencies only
	@$(call log_info,Installing pattern-detect dependencies (pnpm --filter @aiready/pattern-detect install)...)
	$(PNPM) $(SILENT_PNPM) --filter @aiready/pattern-detect install
	@$(call log_success,Pattern-detect dependencies installed.)

update-deps: ## Update dependencies. Usage: make update-deps [FILTER=core]
	@$(MAKE) check-pnpm >/dev/null 2>&1; \
	@$(call log_info,Updating dependencies...); \
	FILTER_ARG=""; \
	if [ -n "$(FILTER)" ]; then FILTER_ARG="--filter $(FILTER)"; fi; \
	CMD="$(PNPM) up --latest $$FILTER_ARG"; \
	$(call log_step,Running dependency update: $$CMD); \
	eval $$CMD || { $(call log_error,Dependency update failed); exit 1; }; \
	$(call log_success,Dependencies updated successfully)

clean: ## Clean all build artifacts and node_modules
	@$(call log_info,Cleaning build artifacts...)
	@find packages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
	@find packages -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
	@rm -rf node_modules
	@rm -rf .turbo/cache
	@$(call log_success,Clean complete)

clean-cache: ## Clean .turbo/cache files older than 3 days
	@$(call log_info,Cleaning .turbo/cache files older than 3 days...)
	@if [ -d .turbo/cache ]; then \
		find .turbo/cache -type f -mtime +3 -delete; \
		$(call log_success,.turbo/cache cleaned (files > 3 days old removed)); \
	else \
		$(call log_info,.turbo/cache does not exist. Skipping.); \
	fi


clear-port: ## Clear common dev port
	$(call kill_port,8888)
	$(call kill_port,8887)
	$(call kill_port,8886)