import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import * as schema from "@shared/schema";

const client = createClient({
  url: 'file:./local.db',
});

const db = drizzle(client, { schema });

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './db/migrations' });
  console.log('Migrations complete!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
