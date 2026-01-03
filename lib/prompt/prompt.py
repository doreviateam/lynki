#!/usr/bin/env python3
# prompt.py - CLI interactif pour capture d'intention Phase 2
# Usage: prompt.py <tenant> [--env <env>]

import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Tentative d'import inquirer, fallback sur input() si non disponible
try:
    import inquirer
    HAS_INQUIRER = True
except ImportError:
    HAS_INQUIRER = False
    print("⚠️  Bibliothèque 'inquirer' non disponible. Utilisation du mode basique (input).")
    print("   Pour une meilleure expérience: pip install inquirer")

# Variable globale pour le fichier de log
_log_file = None

def init_logging(tenant, root_dir):
    """Initialiser le fichier de journalisation"""
    global _log_file
    
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    logs_dir = Path(root_dir) / "tenants" / tenant / "state" / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    
    _log_file = logs_dir / f"intent-{timestamp}.log"
    
    # Écrire en-tête
    with open(_log_file, 'w', encoding='utf-8') as f:
        f.write(f"# Journal d'intention - {timestamp}\n")
        f.write(f"# Tenant: {tenant}\n")
        f.write(f"# Généré par: {os.environ.get('USER', 'unknown')}\n")
        f.write(f"# Format: timestamp|step|question|answer|operator\n")
        f.write(f"\n")
    
    return _log_file

def log_interaction(step, question, answer, operator=None):
    """Journaliser une interaction"""
    global _log_file
    
    if _log_file is None:
        return
    
    timestamp = datetime.utcnow().isoformat() + "Z"
    if operator is None:
        operator = os.environ.get('USER', 'unknown')
    
    # Nettoyer la réponse (masquer secrets si nécessaire)
    safe_answer = answer
    if isinstance(answer, bool):
        safe_answer = "yes" if answer else "no"
    elif isinstance(answer, list):
        safe_answer = ",".join(str(a) for a in answer)
    else:
        safe_answer = str(answer)
    
    # Écrire dans le log
    with open(_log_file, 'a', encoding='utf-8') as f:
        f.write(f"{timestamp}|{step}|{question}|{safe_answer}|{operator}\n")

def prompt_text(question, default=None, validator=None, step=None):
    """Prompt texte simple (fallback si inquirer non disponible)"""
    if default:
        prompt = f"{question} [{default}]: "
    else:
        prompt = f"{question}: "
    
    while True:
        answer = input(prompt).strip()
        if not answer and default:
            answer = default
        if not answer:
            print("  ⚠️  Réponse requise")
            continue
        if validator:
            try:
                validator(answer)
            except ValueError as e:
                print(f"  ❌ {e}")
                continue
        # Journaliser l'interaction
        if step:
            log_interaction(step, question, answer)
        return answer

def prompt_confirm(question, default=True, step=None):
    """Prompt confirmation (oui/non)"""
    default_str = "O/n" if default else "o/N"
    prompt = f"{question} [{default_str}]: "
    
    while True:
        answer = input(prompt).strip().lower()
        if not answer:
            result = default
        elif answer in ['o', 'oui', 'y', 'yes']:
            result = True
        elif answer in ['n', 'non', 'no']:
            result = False
        else:
            print("  ⚠️  Réponse invalide (o/n)")
            continue
        
        # Journaliser l'interaction
        if step:
            log_interaction(step, question, result)
        return result

def prompt_choice(question, choices, default=None, step=None):
    """Prompt choix multiple"""
    print(f"\n{question}")
    for i, choice in enumerate(choices, 1):
        marker = "→" if choice == default else " "
        print(f"  {marker} {i}. {choice}")
    
    while True:
        if default:
            prompt = f"Choix [1-{len(choices)}, défaut: {default}]: "
        else:
            prompt = f"Choix [1-{len(choices)}]: "
        
        answer = input(prompt).strip()
        if not answer and default:
            result = default
        else:
            try:
                idx = int(answer) - 1
                if 0 <= idx < len(choices):
                    result = choices[idx]
                else:
                    print(f"  ⚠️  Choix invalide (1-{len(choices)})")
                    continue
            except ValueError:
                print(f"  ⚠️  Choix invalide (1-{len(choices)})")
                continue
        
        # Journaliser l'interaction
        if step:
            log_interaction(step, question, result)
        return result

def validate_tenant(tenant):
    """Valider format tenant (slug DNS)"""
    import re
    pattern = r'^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
    if not re.match(pattern, tenant):
        raise ValueError("Tenant invalide (doit être un slug DNS: a-z0-9, tirets autorisés)")

def validate_env(env):
    """Valider environnement"""
    if env not in ['lab', 'stinger', 'prod']:
        raise ValueError("Environnement invalide (doit être: lab, stinger, prod)")

def validate_hostname(hostname):
    """Valider format hostname"""
    import re
    # Hostname ou IP
    if '.' in hostname:
        # IP ou hostname
        pattern = r'^[a-z0-9]([a-z0-9.-]{0,253}[a-z0-9])?$'
        if not re.match(pattern, hostname):
            raise ValueError("Hostname invalide (format DNS requis)")
    else:
        raise ValueError("Hostname invalide (doit contenir un point)")

def prompt_step1_context(tenant_arg=None, env_arg=None):
    """Étape 1 : Contexte"""
    print("\n" + "="*60)
    print("📋 Étape 1/7 : Contexte")
    print("="*60)
    
    log_interaction("step1", "start", "Contexte", os.environ.get('USER', 'unknown'))
    
    # Tenant
    if tenant_arg:
        tenant = tenant_arg
        print(f"✅ Tenant: {tenant}")
        log_interaction("step1", "tenant", tenant)
    else:
        tenant = prompt_text("Nom du tenant", validator=validate_tenant, step="step1_tenant")
    
    # Environnement
    if env_arg:
        env = env_arg
        print(f"✅ Environnement: {env}")
        log_interaction("step1", "environment", env)
    else:
        env = prompt_choice("Environnement cible", ['lab', 'stinger', 'prod'], default='lab', step="step1_env")
    
    validate_env(env)
    
    # Double confirmation si prod
    if env == 'prod':
        print("\n⚠️  ATTENTION : Vous êtes sur le point de configurer la PRODUCTION")
        if not prompt_confirm("Confirmer la configuration PRODUCTION", default=False, step="step1_prod_confirm"):
            log_interaction("step1", "cancelled", "Configuration PRODUCTION annulée")
            print("❌ Configuration annulée")
            sys.exit(1)
    
    log_interaction("step1", "complete", f"Tenant: {tenant}, Env: {env}")
    return tenant, env

def prompt_step2_universes():
    """Étape 2 : Univers"""
    print("\n" + "="*60)
    print("📋 Étape 2/7 : Univers (Fonctionnel)")
    print("="*60)
    
    log_interaction("step2", "start", "Univers")
    
    known_universes = ['odoo', 'pos', 'sylius']
    activated_universes = []
    
    for universe in known_universes:
        if prompt_confirm(f"Activer l'univers '{universe}' en production ?", default=(universe == 'odoo'), step=f"step2_universe_{universe}"):
            activated_universes.append(universe)
    
    if not activated_universes:
        print("⚠️  Aucun univers activé. Au moins un univers est requis.")
        if prompt_confirm("Activer 'odoo' par défaut ?", default=True, step="step2_default_odoo"):
            activated_universes = ['odoo']
        else:
            log_interaction("step2", "cancelled", "Aucun univers activé")
            print("❌ Configuration annulée")
            sys.exit(1)
    
    log_interaction("step2", "complete", ",".join(activated_universes))
    print(f"✅ Univers activés: {', '.join(activated_universes)}")
    return activated_universes

def prompt_step3_mode():
    """Étape 3 : Mode de production"""
    print("\n" + "="*60)
    print("📋 Étape 3/7 : Mode de Production")
    print("="*60)
    
    log_interaction("step3", "start", "Mode de production")
    
    mode = prompt_choice(
        "Mode de production",
        ['saas', 'client', 'hybrid'],
        default='saas',
        step="step3_mode"
    )
    
    server_config = None
    client_domain = None
    
    # Phase 3 : Étape 3.1 — Domaine client (si mode != saas)
    if mode in ['client', 'hybrid']:
        print("\n📝 Configuration domaine client (Phase 3):")
        client_domain = prompt_text(
            "Domaine client (ex: rozas.gp, sarl-la-platine.fr)",
            validator=validate_hostname,
            step="step3_client_domain"
        )
        print(f"✅ Domaine client: {client_domain}")
        log_interaction("step3", "client_domain", client_domain)
        
        print("\n📝 Configuration serveur client:")
        server_config = {}
        
        server_config['target'] = prompt_choice(
            "Cible de déploiement",
            ['doreviateam', 'client', 'hybrid'],
            default='client' if mode == 'client' else 'hybrid',
            step="step3_target"
        )
        
        if server_config['target'] in ['client', 'hybrid']:
            server_config['public_ip'] = prompt_text(
                "IP publique du serveur",
                validator=lambda x: validate_hostname(x) if '.' in x else None,
                step="step3_public_ip"
            )
            server_config['ssh_user'] = prompt_text("Utilisateur SSH", default='ubuntu', step="step3_ssh_user")
    
    log_interaction("step3", "complete", f"Mode: {mode}, Client domain: {client_domain or 'N/A'}")
    print(f"✅ Mode: {mode}")
    return mode, server_config, client_domain

def calculate_fqdns(tenant, env, universes, mode, canonical_domain, fallback_domain=None):
    """Calculer les FQDN depuis l'intention (Phase 3: support fallback)"""
    fqdns = {
        'universes': {},
        'services': {},
        'fallback': {}
    }
    
    # FQDN canoniques pour chaque univers
    for universe in universes:
        fqdns['universes'][universe] = f"{universe}.{env}.{tenant}.{canonical_domain}"
    
    # FQDN canoniques pour services cœur (DVIG, Vault) - sans environnement (1 par tenant)
    fqdns['services']['dvig'] = f"dvig.{tenant}.{canonical_domain}"
    fqdns['services']['vault'] = f"vault.{tenant}.{canonical_domain}"
    
    # Phase 3 : Fallback obligatoire si mode Client
    if mode in ['client', 'hybrid'] and fallback_domain:
        # Fallback pour univers
        for universe in universes:
            fqdns['fallback'][f'universe_{universe}'] = f"{universe}.{env}.{tenant}.{fallback_domain}"
        
        # Fallback pour services cœur
        fqdns['fallback']['service_dvig'] = f"dvig.{tenant}.{fallback_domain}"
        fqdns['fallback']['service_vault'] = f"vault.{tenant}.{fallback_domain}"
    
    return fqdns

def prompt_step4_domains(tenant, env, universes, mode, client_domain=None):
    """Étape 4 : Nommage des domaines (Phase 3: support domaines clients + fallback)"""
    print("\n" + "="*60)
    print("📋 Étape 4/7 : Nommage des Domaines")
    print("="*60)
    
    log_interaction("step4", "start", "Nommage des domaines")
    
    # Phase 3 : Déterminer domaine canonique selon mode
    if mode == 'saas':
        canonical = 'doreviateam.com'
        fallback_domain = None
        print(f"✅ Domaine canonique (SaaS): {canonical}")
        log_interaction("step4", "canonical", canonical)
    else:
        # Mode Client/Hybrid : domaine client = canonique
        if client_domain:
            canonical = client_domain
            print(f"✅ Domaine canonique (Client): {canonical}")
            log_interaction("step4", "canonical", canonical)
        else:
            canonical = prompt_text(
                "Domaine canonique",
                default='doreviateam.com',
                validator=validate_hostname,
                step="step4_canonical"
            )
        
        # Phase 3 : Fallback obligatoire en mode Client
        print("\n📋 Fallback (Phase 3):")
        print("  Le domaine Dorevia sera utilisé comme fallback pour support/diagnostic")
        fallback_domain = 'doreviateam.com'
        if not prompt_confirm("Activer le fallback doreviateam.com ? (obligatoire en mode Client)", default=True, step="step4_fallback"):
            print("⚠️  Le fallback est recommandé pour la continuité de service")
            if not prompt_confirm("Confirmer sans fallback ?", default=False, step="step4_fallback_confirm"):
                fallback_domain = 'doreviateam.com'
                print("✅ Fallback activé (recommandé)")
            else:
                fallback_domain = None
                print("⚠️  Fallback désactivé")
        else:
            print(f"✅ Fallback activé: {fallback_domain}")
        log_interaction("step4", "fallback", fallback_domain or "none")
    
    # Calculer FQDN (avec fallback si applicable)
    fqdns = calculate_fqdns(tenant, env, universes, mode, canonical, fallback_domain)
    
    # Afficher FQDN calculés
    print("\n📋 FQDN calculés (canonique):")
    print("\n  Univers:")
    for universe, fqdn in fqdns['universes'].items():
        print(f"    - {universe}: {fqdn}")
    
    print("\n  Services cœur:")
    for service, fqdn in fqdns['services'].items():
        print(f"    - {service}: {fqdn}")
    
    # Afficher fallback si présent
    if fqdns.get('fallback'):
        print("\n📋 FQDN fallback (doreviateam.com):")
        for key, fqdn in fqdns['fallback'].items():
            if key.startswith('universe_'):
                universe = key.replace('universe_', '')
                print(f"    - {universe}: {fqdn}")
            elif key.startswith('service_'):
                service = key.replace('service_', '')
                print(f"    - {service}: {fqdn}")
    
    # Journaliser FQDN calculés
    for universe, fqdn in fqdns['universes'].items():
        log_interaction("step4", f"fqdn_universe_{universe}", fqdn)
    for service, fqdn in fqdns['services'].items():
        log_interaction("step4", f"fqdn_service_{service}", fqdn)
    if fqdns.get('fallback'):
        for key, fqdn in fqdns['fallback'].items():
            log_interaction("step4", f"fqdn_fallback_{key}", fqdn)
    
    # Confirmation
    print("\n⚠️  Vérifiez que ces FQDN sont corrects avant de continuer")
    if not prompt_confirm("Confirmer ces FQDN ?", default=True, step="step4_confirm_fqdn"):
        log_interaction("step4", "cancelled", "FQDN non confirmés")
        print("❌ Configuration annulée")
        sys.exit(1)
    
    log_interaction("step4", "complete", f"Canonical: {canonical}, Fallback: {fallback_domain or 'none'}")
    return canonical, fqdns, fallback_domain

def prompt_step5_aliases(tenant, env, universes, canonical, fallback_domain=None):
    """Étape 5 : Alias (optionnel) - Phase 3: avec détection collision"""
    print("\n" + "="*60)
    print("📋 Étape 5/7 : Alias (Optionnel)")
    print("="*60)
    
    log_interaction("step5", "start", "Alias")
    
    aliases = []
    seen_hostnames = set()  # Pour détection collision
    
    # Calculer FQDN canoniques pour détection collision
    fqdns = calculate_fqdns(tenant, env, universes, 'saas' if canonical == 'doreviateam.com' else 'client', canonical, fallback_domain)
    canonical_hostnames = set()
    for fqdn in fqdns['universes'].values():
        canonical_hostnames.add(fqdn)
    for fqdn in fqdns['services'].values():
        canonical_hostnames.add(fqdn)
    if fqdns.get('fallback'):
        for fqdn in fqdns['fallback'].values():
            canonical_hostnames.add(fqdn)
    
    if not prompt_confirm("Ajouter des alias ?", default=False, step="step5_add_aliases"):
        print("✅ Aucun alias configuré")
        log_interaction("step5", "complete", "Aucun alias")
        return aliases
    
    print("\n📝 Configuration des alias:")
    print("  Format: <service> <hostname>")
    print("  Services: odoo, dvig, vault, ou 'global' (tous services)")
    print("  Exemple: odoo erp.client.com")
    print("  Exemple: global api.client.com")
    print("  (Tapez 'fin' pour terminer)")
    
    alias_count = 0
    while True:
        alias_input = prompt_text("Alias (service hostname) ou 'fin'", default='fin', step=f"step5_alias_{alias_count}")
        
        if alias_input.lower() == 'fin':
            break
        
        parts = alias_input.split()
        if len(parts) != 2:
            print("  ⚠️  Format invalide. Utilisez: <service> <hostname>")
            continue
        
        service, hostname = parts
        
        # Valider service
        if service not in ['odoo', 'dvig', 'vault', 'global']:
            print(f"  ⚠️  Service invalide: {service} (doit être: odoo, dvig, vault, global)")
            continue
        
        # Valider hostname
        try:
            validate_hostname(hostname)
        except ValueError as e:
            print(f"  ❌ {e}")
            continue
        
        # Détection collision : alias ne doit pas être un FQDN canonique
        if hostname in canonical_hostnames:
            print(f"  ❌ ERREUR: L'alias '{hostname}' entre en collision avec un FQDN canonique")
            print(f"     Les alias doivent être différents des FQDN canoniques")
            continue
        
        # Détection collision : alias ne doit pas être dupliqué
        if hostname in seen_hostnames:
            print(f"  ❌ ERREUR: L'alias '{hostname}' est déjà configuré")
            print(f"     Chaque alias doit être unique")
            continue
        
        # Ajouter alias
        aliases.append({
            'service': service,
            'hostname': hostname
        })
        seen_hostnames.add(hostname)
        log_interaction("step5", f"alias_{alias_count}", f"{service}:{hostname}")
        alias_count += 1
        print(f"  ✅ Alias ajouté: {service} → {hostname}")
    
    if aliases:
        print(f"\n✅ {len(aliases)} alias configuré(s)")
        print("  Résumé:")
        for alias in aliases:
            print(f"    - {alias['service']}: {alias['hostname']}")
    else:
        print("\n✅ Aucun alias configuré")
    
    log_interaction("step5", "complete", f"{len(aliases)} alias(s)")
    return aliases

def prompt_step6_preflight():
    """Étape 6 : Préflight & Installation contrôlée"""
    print("\n" + "="*60)
    print("📋 Étape 6/7 : Préflight & Installation")
    print("="*60)
    
    log_interaction("step6", "start", "Préflight")
    
    preflight_config = {}
    
    # Préflight
    preflight_config['enabled'] = prompt_confirm(
        "Lancer un préflight production ? (recommandé)",
        default=True,
        step="step6_preflight_enabled"
    )
    
    # Installation contrôlée
    if preflight_config['enabled']:
        preflight_config['install_controlled'] = prompt_confirm(
            "Autoriser l'installation contrôlée des pré-requis manquants ?",
            default=False,
            step="step6_install_controlled"
        )
    else:
        preflight_config['install_controlled'] = False
    
    if preflight_config['enabled']:
        print(f"✅ Préflight activé (installation contrôlée: {'oui' if preflight_config['install_controlled'] else 'non'})")
    else:
        print("⚠️  Préflight désactivé")
    
    log_interaction("step6", "complete", f"Enabled: {preflight_config['enabled']}, Install: {preflight_config['install_controlled']}")
    return preflight_config

def prompt_step7_summary(tenant, env, universes, mode, canonical, aliases, preflight_config, fallback_domain=None):
    """Étape 7 : Résumé final (écran de vérité) - Phase 3: support fallback"""
    print("\n" + "="*60)
    print("📋 Étape 7/7 : Résumé Final (Écran de Vérité)")
    print("="*60)
    
    log_interaction("step7", "start", "Résumé final")
    
    # Calculer FQDN pour affichage (avec fallback si applicable)
    fqdns = calculate_fqdns(tenant, env, universes, mode, canonical, fallback_domain)
    
    # Afficher résumé
    print("\n📊 Configuration capturée:")
    print(f"  Tenant: {tenant}")
    print(f"  Environnement: {env}")
    print(f"  Univers activés: {', '.join(universes)}")
    print(f"  Mode: {mode}")
    print(f"  Domaine canonique: {canonical}")
    if fallback_domain:
        print(f"  Domaine fallback: {fallback_domain}")
    
    print("\n🌐 FQDN calculés (canonique):")
    print("  Univers:")
    for universe, fqdn in fqdns['universes'].items():
        print(f"    - {universe}: {fqdn}")
    print("  Services cœur:")
    for service, fqdn in fqdns['services'].items():
        print(f"    - {service}: {fqdn}")
    
    if fqdns.get('fallback'):
        print("\n🌐 FQDN fallback (doreviateam.com):")
        for key, fqdn in fqdns['fallback'].items():
            if key.startswith('universe_'):
                universe = key.replace('universe_', '')
                print(f"    - {universe}: {fqdn}")
            elif key.startswith('service_'):
                service = key.replace('service_', '')
                print(f"    - {service}: {fqdn}")
    
    if aliases:
        print(f"\n🔗 Alias ({len(aliases)} configuré(s)):")
        for alias in aliases:
            print(f"    - {alias['service']}: {alias['hostname']}")
    else:
        print("\n🔗 Alias: aucun")
    
    print("\n🔍 Préflight:")
    print(f"  Activé: {'oui' if preflight_config['enabled'] else 'non'}")
    if preflight_config['enabled']:
        print(f"  Installation contrôlée: {'oui' if preflight_config['install_controlled'] else 'non'}")
    
    # Journaliser résumé
    log_interaction("step7", "summary", json.dumps({
        'tenant': tenant,
        'env': env,
        'universes': universes,
        'mode': mode,
        'canonical': canonical,
        'fallback_domain': fallback_domain,
        'aliases_count': len(aliases),
        'preflight_enabled': preflight_config['enabled']
    }))
    
    print("\n" + "="*60)
    print("⚠️  VÉRIFIEZ ATTENTIVEMENT cette configuration avant de continuer")
    print("="*60)
    
    # Confirmation finale
    confirmed = prompt_confirm("Confirmer la génération de la configuration ?", default=False, step="step7_confirm")
    if confirmed:
        log_interaction("step7", "complete", "Configuration confirmée")
    else:
        log_interaction("step7", "cancelled", "Configuration non confirmée")
    return confirmed

def main():
    """Main function"""
    # Parser arguments
    tenant_arg = None
    env_arg = None
    
    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == '--env' and i + 1 < len(sys.argv):
            env_arg = sys.argv[i + 1]
            i += 2
        elif not arg.startswith('--'):
            tenant_arg = arg
            i += 1
        else:
            i += 1
    
    # Initialiser journalisation (avant toute interaction)
    if tenant_arg:
        init_logging(tenant_arg, str(ROOT_DIR))
    else:
        # Si tenant non fourni, on initialisera après l'étape 1
        pass
    
    print("🎯 Dorevia Platform - Capture d'Intention Phase 2")
    print("="*60)
    
    # Étape 1 : Contexte
    tenant, env = prompt_step1_context(tenant_arg, env_arg)
    
    # Initialiser journalisation si pas encore fait
    if _log_file is None:
        init_logging(tenant, str(ROOT_DIR))
    
    # Étape 2 : Univers
    universes = prompt_step2_universes()
    
    # Étape 3 : Mode
    mode, server_config, client_domain = prompt_step3_mode()
    
    # Étape 4 : Domaines
    canonical, fqdns, fallback_domain = prompt_step4_domains(tenant, env, universes, mode, client_domain)
    
    # Étape 5 : Alias (Phase 3: avec détection collision)
    aliases = prompt_step5_aliases(tenant, env, universes, canonical, fallback_domain)
    
    # Étape 6 : Préflight & Installation
    preflight_config = prompt_step6_preflight()
    
    # Étape 7 : Résumé final
    if not prompt_step7_summary(tenant, env, universes, mode, canonical, aliases, preflight_config, fallback_domain):
        print("❌ Configuration annulée")
        sys.exit(1)
    
    # Retourner toutes les données pour génération (US-1.4)
    return {
        'tenant': tenant,
        'env': env,
        'universes': universes,
        'mode': mode,
        'server_config': server_config,
        'client_domain': client_domain,
        'canonical': canonical,
        'fallback_domain': fallback_domain,
        'fqdns': fqdns,
        'aliases': aliases,
        'preflight': preflight_config
    }

def generate_intent_file(result, tenant, root_dir):
    """Générer fichier intention JSON (Phase 3: support domaines clients + fallback)"""
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    
    # Construire structure intention
    intent_data = {
        "version": "2.0",
        "tenant_id": tenant,
        "environment": result['env'],
        "created_at": datetime.utcnow().isoformat() + "Z",
        "intention": {
            "universes": result['universes'],
            "mode": result['mode'],
            "domains": {
                "canonical": result['canonical'],
                "aliases": result['aliases']
            },
            "preflight": result['preflight']
        }
    }
    
    # Phase 3 : Ajouter fallback si présent
    if result.get('fallback_domain'):
        intent_data["intention"]["domains"]["fallback"] = result['fallback_domain']
    
    # Ajouter created_by si disponible
    created_by = os.environ.get('USER') or os.environ.get('USERNAME') or 'unknown'
    if '@' not in created_by:
        created_by = f"{created_by}@doreviateam.com"
    intent_data["created_by"] = created_by
    
    # Ajouter server_config si présent
    if result.get('server_config'):
        intent_data["intention"]["server"] = result['server_config']
    
    # Créer répertoire si nécessaire
    intents_dir = Path(root_dir) / "tenants" / tenant / "state" / "intents"
    intents_dir.mkdir(parents=True, exist_ok=True)
    
    # Nom du fichier
    intent_file = intents_dir / f"intent-{timestamp}.json"
    
    # Écrire fichier
    with open(intent_file, 'w', encoding='utf-8') as f:
        json.dump(intent_data, f, indent=2, ensure_ascii=False)
    
    return intent_file, intent_data

def generate_intent_log(result, tenant, root_dir, timestamp):
    """Générer fichier journal intention (déjà créé par init_logging)"""
    global _log_file
    
    # Le fichier de log a déjà été créé et utilisé par init_logging()
    # On ajoute juste une ligne de résumé final
    if _log_file and _log_file.exists():
        with open(_log_file, 'a', encoding='utf-8') as f:
            f.write(f"{datetime.utcnow().isoformat()}Z|summary|intention_captured|yes|{os.environ.get('USER', 'unknown')}\n")
        return _log_file
    
    # Fallback si _log_file n'est pas défini
    logs_dir = Path(root_dir) / "tenants" / tenant / "state" / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file = logs_dir / f"intent-{timestamp}.log"
    
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write(f"# Journal d'intention - {timestamp}\n")
        f.write(f"# Tenant: {tenant}\n")
        f.write(f"# Environnement: {result['env']}\n")
        f.write(f"# Généré par: {os.environ.get('USER', 'unknown')}\n")
        f.write(f"# Format: timestamp|step|question|answer|operator\n")
        f.write(f"\n")
        f.write(f"{datetime.utcnow().isoformat()}Z|summary|intention_captured|yes|{os.environ.get('USER', 'unknown')}\n")
    
    return log_file

if __name__ == '__main__':
    try:
        result = main()
        
        # Générer fichier intention (US-1.4)
        intent_file, intent_data = generate_intent_file(result, result['tenant'], str(ROOT_DIR))
        timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        log_file = generate_intent_log(result, result['tenant'], str(ROOT_DIR), timestamp)
        
        print("\n" + "="*60)
        print("✅ Configuration intention générée")
        print("="*60)
        print(f"📄 Fichier intention: {intent_file}")
        print(f"📄 Fichier journal: {log_file}")
        print(f"\n💡 Prochaines étapes:")
        print(f"   1. Valider: dorevia.sh validate {result['tenant']}")
        print(f"   2. Générer: dorevia.sh render {result['tenant']} --env {result['env']}")
        print(f"   3. Déployer: dorevia.sh apply {result['tenant']} --env {result['env']} --intent {intent_file}")
        
    except KeyboardInterrupt:
        print("\n\n❌ Configuration annulée par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

