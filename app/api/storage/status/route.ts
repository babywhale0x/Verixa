import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserStorage } from '@/lib/contract-queries';

export async function GET(request: NextRequest) {
  try {
    const user = await auth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get from database
    const storageBalance = await prisma.storageBalance.findUnique({
      where: { userId: user.id },
    });

    // Also get from blockchain
    const chainStorage = await getUserStorage(user.walletAddress);

    const totalBytes = storageBalance?.totalBytes || BigInt(0);
    const walletBalance = storageBalance?.walletBalance || 0;

    // Calculate monthly cost
    const bytesPerGB = 1073741824;
    const costPerGBMonthOctas = 100000;
    const gb = Math.ceil(Number(totalBytes) / bytesPerGB);
    const monthlyCost = BigInt(gb * costPerGBMonthOctas);
    const monthsRemaining = monthlyCost > 0 
      ? BigInt(Math.floor(Number(walletBalance) * 100000000 / Number(monthlyCost)))
      : BigInt(0);

    return NextResponse.json({
      totalBytes: totalBytes.toString(),
      walletBalance: (Number(walletBalance) * 100000000).toString(), // Convert to octas
      monthlyCost: monthlyCost.toString(),
      monthsRemaining: monthsRemaining.toString(),
      inGracePeriod: chainStorage.inGracePeriod,
    });
  } catch (error) {
    console.error('Failed to fetch storage status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage status' },
      { status: 500 }
    );
  }
}
