import { ResourceForm } from '../../../../components/dashboard/resource-form';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <ResourceForm resource="projects" recordId={params.id} />;
}
