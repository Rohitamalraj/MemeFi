'use client';

import { useCurrentAccount, useDisconnectWallet, useWallets, useConnectWallet } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WalletButton() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();
  const { mutate: connect, isLoading } = useConnectWallet();

  const handleConnect = (walletName: string) => {
    const wallet = wallets.find((w) => w.name === walletName);
    if (wallet) {
      connect(
        { wallet },
        {
          onSuccess: () => console.log('Connected to', walletName),
          onError: (error) => console.error('Connection failed:', error),
        }
      );
    }
  };

  if (!currentAccount) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isLoading}
            className="bg-[#AFFF00] text-[#121212] hover:bg-[#AFFF00]/90 font-bold px-6 py-3 rounded-lg"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-64 bg-white border-2 border-[#121212] rounded-lg p-2"
        >
          {wallets.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[#121212]/70 mb-3">No Sui wallets detected</p>
              <a
                href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#AFFF00] hover:text-[#AFFF00]/80 underline"
              >
                Install Sui Wallet →
              </a>
            </div>
          ) : (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-[#121212]/50 uppercase">
                Available Wallets
              </div>
              {wallets.map((wallet) => (
                <DropdownMenuItem
                  key={wallet.name}
                  onClick={() => handleConnect(wallet.name)}
                  className="flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg hover:bg-[#AFFF00]/20 focus:bg-[#AFFF00]/20"
                >
                  {wallet.icon && (
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="w-8 h-8 rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-[#121212]">{wallet.name}</p>
                    <p className="text-xs text-[#121212]/60">
                      {wallet.installed ? '✓ Installed' : '⚠ Not Installed'}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="bg-[#AFFF00] text-[#121212] font-bold border-2 border-[#121212] px-4 py-2 rounded-lg flex items-center">
        <Wallet className="w-4 h-4 mr-2" />
        {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="border-2 border-[#121212] rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
        onClick={() => disconnect()}
        title="Disconnect"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
