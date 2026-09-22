import { PrismaClient } from '@prisma/client';
import ClientHome from '@/components/ClientHome';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function Home() {
  const allDigests = await prisma.digest.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const digestsByDate = allDigests.reduce((acc, digest) => {
    const dateStr = format(new Date(digest.createdAt), 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = {
        dateStr,
        displayDate: format(new Date(digest.createdAt), 'd MMMM yyyy', { locale: fr }),
        iaDigest: null,
        luxDigest: null,
      };
    }
    if (digest.category === 'IA' && !acc[dateStr].iaDigest) {
      acc[dateStr].iaDigest = digest;
    }
    if (digest.category === 'Luxembourg' && !acc[dateStr].luxDigest) {
      acc[dateStr].luxDigest = digest;
    }
    return acc;
  }, {} as Record<string, any>);

  const groupedDigests = Object.values(digestsByDate);

  return (
    <ClientHome 
      groupedDigests={groupedDigests} 
    />
  );
}
