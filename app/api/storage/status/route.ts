import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserStorage } from '@/lib/contract-queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    let user = await auth();

    if (!user && wallet) {
      const dbUser = await prisma.user.findUnique({ where: { walletAddress: wallet }});
      if (dbUser) {
        user = { id: dbUser.id, walletAddress: dbUser.walletAddress };
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Aggregate total size from user's files
    const fileStats = await prisma.file.aggregate({
      where: { userId: user.id },
      _sum: { size: true },
    });
    const totalBytes = fileStats._sum.size || BigInt(0);

    // Fetch ShelbyUSD from Aptos Indexer
    let shelbyBalance = BigInt(0);
    try {
      const shelbyMetadata = '0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1';
      const response = await fetch('https://api.testnet.aptoslabs.com/v1/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           query: `{ current_fungible_asset_balances(where: {owner_address: {_eq: "${user.walletAddress}"}, asset_type: {_eq: "${shelbyMetadata}"}}) { amount } }`
        })
      });
      const indexerData = await response.json();
      const balances = indexerData.data?.current_fungible_asset_balances;
      if (balances && balances.length > 0) {
        shelbyBalance = BigInt(balances[0].amount);
      }
    } catch (e) {
      console.error('Failed to fetch Shelby USD balance:', e);
    }

    // Calculate monthly cost
    const bytesPerGB = 1073741824;
    const costPerGBMonthOctas = 100000;
    const gb = Math.ceil(Number(totalBytes) / bytesPerGB);
    const monthlyCost = BigInt(gb * costPerGBMonthOctas);
    const monthsRemaining = monthlyCost > 0 
      ? BigInt(Math.floor(Number(shelbyBalance) / Number(monthlyCost)))
      : BigInt(0);

    // Also get from blockchain for grace period
    const chainStorage = await getUserStorage(user.walletAddress);

    return NextResponse.json({
      totalBytes: totalBytes.toString(),
      walletBalance: shelbyBalance.toString(),
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
