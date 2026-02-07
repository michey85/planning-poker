export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Voting room #{id}
      </h1>
    </div>
  );
}
