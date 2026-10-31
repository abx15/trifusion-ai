import { PrismaClient } from '@prisma/client';

async function main() {
  const p = new PrismaClient();
  try {
    const result = await p.$queryRaw`SELECT 1 as connected`;
    console.log('DB OK:', JSON.stringify(result));
  } catch (e: any) {
    console.log('DB error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

main();
