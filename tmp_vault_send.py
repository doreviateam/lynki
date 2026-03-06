env['account.move'].cron_vault_send_dvig()
env.cr.commit()
print('cron_vault_send_dvig OK')
