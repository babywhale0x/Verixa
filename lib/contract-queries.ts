import { aptos, MARKETPLACE_MODULE, STORAGE_MODULE, SUBSCRIPTION_MODULE } from './aptos';

type MoveFunction = `${string}::${string}::${string}`;

// Marketplace queries

export async function getContent(contentId: bigint) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MARKETPLACE_MODULE}::get_content` as MoveFunction,
        functionArguments: [contentId.toString()],
      },
    });
    return result;
  } catch (error) {
    console.error('Failed to get content:', error);
    return null;
  }
}

export async function getCreatorContents(creatorAddress: string): Promise<bigint[]> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MARKETPLACE_MODULE}::get_creator_contents` as MoveFunction,
        functionArguments: [creatorAddress],
      },
    });

    if (Array.isArray(result) && result[0]) {
      return (result[0] as any[]).map((id) => BigInt(id));
    }
    return [];
  } catch (error) {
    console.error('Failed to get creator contents:', error);
    return [];
  }
}

export async function hasValidAccess(
  userAddress: string,
  contentId: bigint,
  tier: number
): Promise<boolean> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MARKETPLACE_MODULE}::has_valid_access` as MoveFunction,
        functionArguments: [userAddress, contentId.toString(), tier.toString()],
      },
    });

    return result[0] === true;
  } catch (error) {
    console.error('Failed to check access:', error);
    return false;
  }
}

export async function getUserPurchases(userAddress: string): Promise<bigint[]> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MARKETPLACE_MODULE}::get_user_purchases` as MoveFunction,
        functionArguments: [userAddress],
      },
    });

    if (Array.isArray(result) && result[0]) {
      return (result[0] as any[]).map((id) => BigInt(id));
    }
    return [];
  } catch (error) {
    console.error('Failed to get user purchases:', error);
    return [];
  }
}

export async function getPlatformStats(): Promise<{ volume: bigint; transactions: bigint; feeBps: bigint }> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MARKETPLACE_MODULE}::get_platform_stats` as MoveFunction,
        functionArguments: [],
      },
    });

    return {
      volume: BigInt(result[0] as string),
      transactions: BigInt(result[1] as string),
      feeBps: BigInt(result[2] as string),
    };
  } catch (error) {
    console.error('Failed to get platform stats:', error);
    return { volume: BigInt(0), transactions: BigInt(0), feeBps: BigInt(1000) };
  }
}

export async function getCreatorStats(creatorAddress: string): Promise<{
  totalContents: bigint;
  totalSales: bigint;
  totalEarnings: bigint;
  subscriberCount: bigint;
}> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MARKETPLACE_MODULE}::get_creator_stats` as MoveFunction,
        functionArguments: [creatorAddress],
      },
    });

    return {
      totalContents: BigInt(result[0] as string),
      totalSales: BigInt(result[1] as string),
      totalEarnings: BigInt(result[2] as string),
      subscriberCount: BigInt(result[3] as string),
    };
  } catch (error) {
    console.error('Failed to get creator stats:', error);
    return {
      totalContents: BigInt(0),
      totalSales: BigInt(0),
      totalEarnings: BigInt(0),
      subscriberCount: BigInt(0),
    };
  }
}

// Storage queries

export async function getUserStorage(userAddress: string): Promise<{
  totalBytes: bigint;
  walletBalance: bigint;
  monthlyCost: bigint;
  monthsRemaining: bigint;
  inGracePeriod: boolean;
}> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${STORAGE_MODULE}::get_user_storage` as MoveFunction,
        functionArguments: [userAddress],
      },
    });

    return {
      totalBytes: BigInt(result[0] as string),
      walletBalance: BigInt(result[1] as string),
      monthlyCost: BigInt(result[2] as string),
      monthsRemaining: BigInt(result[3] as string),
      inGracePeriod: result[4] as boolean,
    };
  } catch (error) {
    console.error('Failed to get user storage:', error);
    return {
      totalBytes: BigInt(0),
      walletBalance: BigInt(0),
      monthlyCost: BigInt(0),
      monthsRemaining: BigInt(0),
      inGracePeriod: false,
    };
  }
}

export async function isFileAccessible(userAddress: string, blobId: string): Promise<boolean> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${STORAGE_MODULE}::is_file_accessible` as MoveFunction,
        functionArguments: [userAddress, blobId],
      },
    });

    return result[0] === true;
  } catch (error) {
    console.error('Failed to check file accessibility:', error);
    return false;
  }
}

export async function calculateStorageCost(sizeBytes: bigint, months: number): Promise<bigint> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${STORAGE_MODULE}::calculate_storage_cost` as MoveFunction,
        functionArguments: [sizeBytes.toString(), months.toString()],
      },
    });

    return BigInt(result[0] as string);
  } catch (error) {
    console.error('Failed to calculate storage cost:', error);
    return BigInt(0);
  }
}

// Subscription queries

export async function hasActiveSubscription(subscriberAddress: string, creatorAddress: string): Promise<boolean> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${SUBSCRIPTION_MODULE}::has_active_subscription` as MoveFunction,
        functionArguments: [subscriberAddress, creatorAddress],
      },
    });

    return result[0] === true;
  } catch (error) {
    console.error('Failed to check subscription:', error);
    return false;
  }
}

export async function getCreatorSubscriberStats(creatorAddress: string): Promise<{
  subscriberCount: bigint;
  totalRevenue: bigint;
}> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${SUBSCRIPTION_MODULE}::get_creator_subscriber_stats` as MoveFunction,
        functionArguments: [creatorAddress],
      },
    });

    return {
      subscriberCount: BigInt(result[0] as string),
      totalRevenue: BigInt(result[1] as string),
    };
  } catch (error) {
    console.error('Failed to get subscriber stats:', error);
    return { subscriberCount: BigInt(0), totalRevenue: BigInt(0) };
  }
}