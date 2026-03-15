env = env  # noqa: F821
acc = env["account.account"].search([], limit=10)
for a in acc:
    print("%s %s" % (a.code, a.name))
