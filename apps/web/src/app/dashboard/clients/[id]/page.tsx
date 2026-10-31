import { ResourceForm } from '../../../../components/dashboard/resource-form';

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResourceForm resource="clients" recordId={id} />;
}
