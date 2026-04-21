const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$connect()
  .then(() => { console.log('PostgreSQL OK'); return p.$disconnect(); })
  .catch(e => { console.log('PostgreSQL FAILED:', e.message); return p.$disconnect(); });
