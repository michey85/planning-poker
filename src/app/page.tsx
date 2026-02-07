import CreateSessionForm from '@/components/CreateSessionForm';
import JoinSessionForm from '@/components/JoinSessionForm';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Planning Poker
        </h1>
        <p className="mt-3 text-lg text-foreground/60">
          Real-time collaborative estimation for Scrum teams.
        </p>
      </header>

      <main className="grid w-full max-w-2xl gap-8 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-muted p-6">
          <CreateSessionForm />
        </section>
        <section className="rounded-xl border border-border bg-muted p-6">
          <JoinSessionForm />
        </section>
      </main>
    </div>
  );
}
