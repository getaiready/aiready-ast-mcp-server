'use client';

import { useState } from 'react';

export function useBilling(
  currentTeamId: string,
  setUploadError: (err: string | null) => void
) {
  const [billingLoading, setBillingLoading] = useState(false);

  async function handleCheckout(plan: 'pro' | 'team') {
    try {
      setBillingLoading(true);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkout',
          teamId: currentTeamId,
          plan,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setUploadError(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setUploadError('Checkout failed. Please try again.');
    } finally {
      setBillingLoading(false);
    }
  }

  async function handlePortal(customerId: string) {
    try {
      setBillingLoading(true);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'portal',
          customerId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setUploadError(data.error || 'Failed to open portal');
      }
    } catch (err) {
      console.error('Portal error:', err);
      setUploadError('Failed to open billing portal.');
    } finally {
      setBillingLoading(false);
    }
  }

  return {
    billingLoading,
    handleCheckout,
    handlePortal,
  };
}
