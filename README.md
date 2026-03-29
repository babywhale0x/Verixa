# Verixa

A decentralized storage and creator marketplace platform built on Aptos and Shelby Protocol.

## Features

- **Permanent Storage**: Files stored on Shelby Protocol's decentralized network
- **Creator Marketplace**: Publish and monetize creative content
- **Multiple Access Tiers**: View, Borrow, License, and Commercial options
- **Direct Payments**: 90% to creators, 10% platform fee
- **Fiat Onramp**: Stripe integration for non-crypto users
- **Encrypted Vault**: Private encrypted storage for personal files

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Blockchain**: Aptos (Move smart contracts)
- **Storage**: Shelby Protocol
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe for fiat onramp
- **Wallet**: Petra Wallet + Aptos Connect

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd verixa
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Aptos Testnet
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_VERIXA_MODULE_ADDRESS=your_deployed_contract_address

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/verixa

# Stripe (optional, for fiat onramp)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Database Setup

```bash
# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# (Optional) Seed database
npm run db:seed
```

### 4. Deploy Smart Contracts (Testnet)

```bash
# Install Aptos CLI first: https://aptos.dev/tools/aptos-cli/

# Initialize Aptos CLI
aptos init --network testnet

# Fund your account
aptos account fund-with-faucet --account default

# Update Move.toml with your address
# Edit contracts/Move.toml and replace verixa = "_" with your address

# Compile and publish
aptos move publish --package-dir contracts --named-addresses verixa=YOUR_ADDRESS

# Save the deployed address to .env.local
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
verixa/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── (tabs)/            # Main app tabs
│   └── ...
├── components/            # React components
│   ├── wallet/           # Wallet integration
│   ├── upload/           # File upload components
│   └── ...
├── contracts/            # Move smart contracts
│   ├── sources/         # Contract source files
│   └── Move.toml        # Package manifest
├── lib/                  # Utility libraries
│   ├── aptos.ts        # Aptos configuration
│   ├── shelby.ts       # Shelby Protocol integration
│   ├── stripe.ts       # Stripe integration
│   └── db/             # Database client
├── scripts/             # Deployment scripts
└── prisma/              # Database schema
```

## Smart Contracts

### Marketplace Contract
- `publish_content`: Publish new content with pricing tiers
- `purchase_access`: Buy access to content
- `has_valid_access`: Check if user has access

### Storage Contract
- `register_user`: Register for storage service
- `fund_wallet`: Add funds to storage wallet
- `add_file`: Upload file to storage
- `process_deductions`: Monthly auto-deduction

### Subscription Contract
- `create_subscription_tier`: Set up creator subscription
- `subscribe`: Subscribe to a creator
- `has_active_subscription`: Check subscription status

## API Routes

- `POST /api/upload` - Initiate file upload
- `POST /api/upload/complete` - Complete file upload
- `GET /api/download/[blobId]` - Download file
- `GET /api/storage/files` - List user's files
- `GET /api/storage/status` - Get storage stats
- `POST /api/stripe/create-intent` - Create payment intent
- `POST /api/stripe/webhook` - Stripe webhook handler

## Deployment

### Vercel (Frontend)

```bash
npm install -g vercel
vercel
```

### Database (Production)

Use a managed PostgreSQL service like:
- Supabase
- Railway
- AWS RDS

### Smart Contracts (Mainnet)

1. Update `NEXT_PUBLIC_APTOS_NETWORK=mainnet` in `.env.local`
2. Ensure you have mainnet APT
3. Deploy contracts:

```bash
aptos move publish --package-dir contracts --named-addresses verixa=YOUR_ADDRESS --network mainnet
```

## Testing

```bash
# Run unit tests
npm test

# Run E2E tests (if configured)
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, join our Discord or open an issue on GitHub.

## Acknowledgments

- Built on [Aptos](https://aptoslabs.com/)
- Storage by [Shelby Protocol](https://shelby.xyz/)
- Wallet by [Petra](https://petra.app/)
