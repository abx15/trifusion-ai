import { ResourceForm } from '../../../../components/dashboard/resource-form';

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return <ResourceForm resource="clients" recordId={params.id} />;
}
