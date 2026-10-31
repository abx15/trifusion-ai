import { ResourceForm } from '../../../../components/dashboard/resource-form';

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResourceForm resource="tasks" recordId={id} />;
}
