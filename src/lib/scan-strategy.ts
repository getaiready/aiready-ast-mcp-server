import { toast } from 'sonner';

export async function updateScanStrategy(
  settings: any | null,
  onSuccess?: () => void
) {
  try {
    const res = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scanConfig: settings }),
    });
    if (res.ok) {
      toast.success('Default scan strategy updated');
      if (onSuccess) onSuccess();
      return true;
    } else {
      throw new Error('Failed to update strategy');
    }
  } catch (err) {
    console.error('Failed to update scan strategy:', err);
    toast.error('Failed to save strategy');
    throw err;
  }
}
