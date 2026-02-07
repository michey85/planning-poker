import SessionRoom from '@/components/SessionRoom';

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SessionRoom sessionId={id} />;
}
