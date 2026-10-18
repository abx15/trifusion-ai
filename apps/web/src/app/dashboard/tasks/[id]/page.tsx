import { ResourceForm } from '../../../../components/dashboard/resource-form';

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  return <ResourceForm resource="tasks" recordId={params.id} />;
}
