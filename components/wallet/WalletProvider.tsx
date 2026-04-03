'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PropsWithChildren } from 'react';

const optInWallets = ['Petra'];

const dappInfo = {
  aptosConnect: {
    dappName: 'Verixa',
  },
};

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <AptosWalletAdapterProvider
      dappInfo={dappInfo}
      autoConnect={false}
      optInWallets={optInWallets}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}