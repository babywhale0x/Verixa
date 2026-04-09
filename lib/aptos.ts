import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Initialize Aptos client
const config = new AptosConfig({
  network: (process.env.NEXT_PUBLIC_APTOS_NETWORK as Network) || Network.TESTNET,
});

export const aptos = new Aptos(config);

// Contract addresses
export const VERIXA_MODULE_ADDRESS = process.env.NEXT_PUBLIC_VERIXA_MODULE_ADDRESS || '';

// Module names
export const MARKETPLACE_MODULE = `${VERIXA_MODULE_ADDRESS}::marketplace`;
export const STORAGE_MODULE = `${VERIXA_MODULE_ADDRESS}::storage`;
export const SUBSCRIPTION_MODULE = `${VERIXA_MODULE_ADDRESS}::subscription`;

// Access tier constants
export const TIER_FREE = 0;
export const TIER_STREAM = 1;
export const TIER_CITE = 2;
export const TIER_LICENSE = 3;
export const TIER_COMMERCIAL = 4;
export const TIER_SUBSCRIPTION = 5;

// Platform fee (10%)
export const PLATFORM_FEE_BPS = 1000;

// Helper to convert APT to octas (smallest unit)
export function aptToOctas(apt: number): number {
  return Math.floor(apt * 100000000);
}

// Helper to convert octas to APT
export function octasToApt(octas: number): number {
  return octas / 100000000;
}

// Format APT amount for display
export function formatApt(octas: number): string {
  return `${octasToApt(octas).toFixed(4)} APT`;
}

// Get tier name
export function getTierName(tier: number): string {
  switch (tier) {
    case TIER_FREE:
      return 'Free Preview';
    case TIER_STREAM:
      return 'Stream (In-App)';
    case TIER_CITE:
      return 'Cite (On-chain Reference)';
    case TIER_LICENSE:
      return 'License';
    case TIER_COMMERCIAL:
      return 'Commercial';
    case TIER_SUBSCRIPTION:
      return 'Subscription';
    default:
      return 'Unknown';
  }
}

// Calculate platform fee
export function calculatePlatformFee(amount: number): number {
  return Math.floor((amount * PLATFORM_FEE_BPS) / 10000);
}

// Calculate creator earnings
export function calculateCreatorEarnings(amount: number): number {
  return amount - calculatePlatformFee(amount);
}
