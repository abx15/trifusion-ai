import { ResourceForm } from '../../../../components/dashboard/resource-form';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResourceForm resource="projects" recordId={id} />;
}
