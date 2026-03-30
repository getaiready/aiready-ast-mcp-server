'use client';

import { FeedbackWidget as SharedFeedbackWidget } from '@aiready/components';
import { toast } from 'sonner';

export default function FeedbackWidget() {
  return (
    <SharedFeedbackWidget
      onSuccess={() => toast.success('Feedback sent! Thank you.')}
      onError={() => toast.error('Failed to send feedback. Please try again.')}
    />
  );
}
