import { PrismaService } from './src/common/prisma/prisma.service';

async function main() {
  const p = new PrismaService();
  try {
    await p.$connect();
    console.log('Connected OK');
    const result = await p.$queryRaw`SELECT 1 as connected`;
    console.log('Query OK:', JSON.stringify(result));
  } catch (e: any) {
    console.log('Error:', e.message);
    console.log('Stack:', e.stack);
  } finally {
    await p.$disconnect();
  }
}

main();
