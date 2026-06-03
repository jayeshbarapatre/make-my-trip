import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const faqs = await prisma.faq.findMany();
  console.log('FAQs found in DB:', JSON.stringify(faqs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
