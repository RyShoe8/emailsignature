import { listFeedbackSubmissions } from '@/lib/admin/feedback';
import { FeedbackAdminTable } from '@/components/admin/FeedbackAdminTable';

export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
  const submissions = await listFeedbackSubmissions();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Feedback</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bug reports and feature requests from dashboard users. Use the email link to follow up.
        </p>
      </div>
      <FeedbackAdminTable initialSubmissions={submissions} />
    </div>
  );
}
