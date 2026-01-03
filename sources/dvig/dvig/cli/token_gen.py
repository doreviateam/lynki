"""
CLI de génération de tokens DVIG
"""
import click
import secrets
import base64
import hashlib
from datetime import datetime, timezone  # CORRECTION I5 : Import timezone

@click.command()
@click.option('--tenant', required=True, help='Tenant ID (ex: rehtse)')
@click.option('--univers', required=True, help='Univers (ex: odoo, sylius)')
@click.option('--output', type=click.Choice(['token', 'hash', 'yaml']), default='token',
              help='Format de sortie')
def generate(tenant: str, univers: str, output: str):
    """Génère un token DVIG"""
    # Générer token
    raw = secrets.token_bytes(32)
    token = "dvig_" + base64.urlsafe_b64encode(raw).rstrip(b"=").decode()
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    token_id = f"tok_{secrets.token_hex(4)}"
    
    if output == 'token':
        click.echo(f"TOKEN={token}")
        click.echo(f"HASH=sha256:{token_hash}")
    elif output == 'hash':
        click.echo(f"sha256:{token_hash}")
    elif output == 'yaml':
        click.echo(f"""
- id: "{token_id}"
  token_hash: "sha256:{token_hash}"
  tenant: "{tenant}"
  univers: "{univers}"
  status: "active"
  created_at: "{datetime.now(timezone.utc).isoformat()}"
  comment: "Generated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
""")

if __name__ == '__main__':
    generate()

