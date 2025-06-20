Set-Content .env -Value @"
# Since the ".env" file is gitignored, you can use the ".env.example" file to
# build a new ".env" file when you clone the repo. Keep this file up-to-date
# when you add new variables to `.env`.

# This file will be committed to version control, so make sure not to have any
# secrets in it. If you are cloning this repo, create a copy of this file named
# ".env" and populate it with your secrets.

# When adding additional environment variables, the schema in "/src/env.js"
# should be updated accordingly.

# Drizzle
DATABASE_URL="postgres://neondb_owner:npg_vzBNPR3yn4XV@ep-rapid-forest-a4fa0vr8-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
BETTER_AUTH_SECRET="a-very-secret-key"
"@ 