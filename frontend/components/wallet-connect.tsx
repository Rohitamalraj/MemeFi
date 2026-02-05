'use client';

import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function WalletConnectButton() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [isOpen, setIsOpen] = useState(false);

  if (currentAccount) {
    return (
      <Button
        onClick={() => disconnect()}
        variant="outline"
        className="rounded-full border-lime/20 bg-charcoal/50 text-lime hover:bg-lime hover:text-charcoal"
      >
        {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
      </Button>
    );
  }

  return (
    <ConnectButton
      className="rounded-full bg-lime px-6 py-3 font-medium text-charcoal hover:bg-lime/90"
      connectText="Connect Wallet"
    />
  );
}

// Alternative custom wallet connect
export function CustomWalletConnect() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  if (currentAccount) {
    return (
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-lime/10 px-4 py-2 text-sm text-lime">
          {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
        </div>
        <Button
          onClick={() => disconnect()}
          variant="ghost"
          size="sm"
          className="text-lime hover:text-lime/80"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <ConnectButton
      className="rounded-full bg-lime px-6 py-3 font-medium text-charcoal hover:bg-lime/90"
      connectText="Connect Wallet"
    />
  );
}
