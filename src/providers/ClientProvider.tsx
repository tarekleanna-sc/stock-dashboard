'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { AdvisorClient } from '@/types/advisor';

interface ClientContextValue {
  selectedClient: AdvisorClient | null;  // null = advisor's own portfolio
  setSelectedClient: (client: AdvisorClient | null) => void;
}

const ClientContext = createContext<ClientContextValue>({
  selectedClient: null,
  setSelectedClient: () => {},
});

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClient] = useState<AdvisorClient | null>(null);

  return (
    <ClientContext.Provider value={{ selectedClient, setSelectedClient }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useSelectedClient() {
  return useContext(ClientContext);
}
