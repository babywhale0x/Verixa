import Stripe from 'stripe';
import { aptos, aptToOctas } from './aptos';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createFiatOnrampIntent(
  amountUsd: number,
  walletAddress: string,
  userId: string
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amountUsd * 100), // Convert to cents
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: {
      walletAddress,
      userId,
      type: 'wallet_funding',
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

export async function handleWebhook(payload: string, signature: string) {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { walletAddress, userId, type } = paymentIntent.metadata;

    if (type === 'wallet_funding') {
      // Convert USD to APT
      const aptAmount = await convertUsdToApt(paymentIntent.amount / 100);

      // Fund user wallet
      await fundUserWallet(walletAddress, aptAmount);

      // Update database
      await updateUserStorageBalance(userId, aptAmount);
    }
  }

  return event;
}

async function convertUsdToApt(usdAmount: number): Promise<number> {
  // Fetch APT price from CoinGecko or similar
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd');
  const data = await response.json();
  const aptPrice = data.aptos.usd;

  const aptAmount = usdAmount / aptPrice;
  return aptToOctas(aptAmount);
}

async function fundUserWallet(address: string, amountOctas: number) {
  // Use platform treasury wallet to send APT
  const { Ed25519PrivateKey } = await import('@aptos-labs/ts-sdk');
    const treasuryAccount = await aptos.deriveAccountFromPrivateKey({
      privateKey: new Ed25519PrivateKey(process.env.TREASURY_PRIVATE_KEY!),
    });

  const transaction = await aptos.transaction.build.simple({
    sender: treasuryAccount.accountAddress,
    data: {
      function: '0x1::aptos_account::transfer',
      functionArguments: [address, amountOctas],
    },
  });

  const pendingTxn = await aptos.signAndSubmitTransaction({
    signer: treasuryAccount,
    transaction,
  });

  return aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
}

async function updateUserStorageBalance(userId: string, amountOctas: number) {
  const { prisma } = await import('./db');

  await prisma.storageBalance.update({
    where: { userId },
    data: {
      walletBalance: {
        increment: amountOctas / 100000000, // Convert to APT for storage
      },
    },
  });
}

export { stripe };
