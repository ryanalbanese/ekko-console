import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getBootstrapData,
  getSelectedIdentity,
  setSelectedIdentity,
  setBootstrapData,
} from '@/utils/auth';
import { getBootstrapData as fetchBootstrapData } from '@/utils/apiClient';
import type { BootstrapIdentity } from '@/types/api';

export function IdentitySelector() {
  const [selectedIdentity, setSelected] = useState<BootstrapIdentity | null>(
    null
  );
  const [identities, setIdentities] = useState<BootstrapIdentity[]>([]);

  useEffect(() => {
    // Load bootstrap data - try fetching fresh data first, fallback to localStorage
    const loadIdentities = async () => {
      try {
        // Try to fetch fresh bootstrap data from API
        const freshBootstrap = await fetchBootstrapData();
        if (freshBootstrap) {
          // Update stored bootstrap data
          setBootstrapData(freshBootstrap);
          
          if (freshBootstrap.identities.from.length > 0) {
            setIdentities(freshBootstrap.identities.from);
            
            // Get current selected identity or preselect defaultFrom if present, else first identity
            const current = getSelectedIdentity();
            if (current) {
              setSelected(current);
            } else {
              const defaultIdentity =
                freshBootstrap.defaultFrom || freshBootstrap.identities.from[0];
              if (defaultIdentity) {
                setSelected(defaultIdentity);
                setSelectedIdentity(defaultIdentity);
              }
            }
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch fresh bootstrap data, using cached:', error);
      }
      
      // Fallback to localStorage
      const bootstrap = getBootstrapData();
      if (bootstrap) {
        setIdentities(bootstrap.identities.from);

        // Get current selected identity or preselect defaultFrom if present, else first identity
        const current = getSelectedIdentity();
        if (current) {
          setSelected(current);
        } else {
          const defaultIdentity =
            bootstrap.defaultFrom || bootstrap.identities.from[0];
          if (defaultIdentity) {
            setSelected(defaultIdentity);
            setSelectedIdentity(defaultIdentity);
          }
        }
      }
    };
    
    loadIdentities();
  }, []);

  const handleIdentityChange = (address: string) => {
    const identity = identities.find((id) => id.address === address);
    if (identity) {
      setSelected(identity);
      setSelectedIdentity(identity);
    }
  };

  if (identities.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Chatting as</span>
      <Select
        value={selectedIdentity?.address || ''}
        onValueChange={handleIdentityChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select identity">
            {selectedIdentity?.name || selectedIdentity?.address}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {identities.map((identity) => (
            <SelectItem key={identity.address} value={identity.address}>
              {identity.name || identity.address}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

