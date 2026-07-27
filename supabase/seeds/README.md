# Seeds (homologation / demo only)

These scripts create test users, demo academic data, or reset helpers.

**Do not run on production.**  
**Do not wire into CI/CD as an automatic migration step.**

Some files contain well-known homologation passwords for internal QA. Rotate or omit them for any shared environment that is not a dedicated test project.

Apply manually in the SQL Editor only when setting up or resetting a homologation database, after `../migrations/` has been applied.
