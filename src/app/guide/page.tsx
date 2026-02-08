import Link from 'next/link';
import { CARD_VALUES } from '@/types';

export const metadata = {
  title: 'Story Points Guide | Planning Poker',
};

const POINT_DESCRIPTIONS: Record<
  string,
  { title: string; description: string; examples: string }
> = {
  '1': {
    title: 'Trivial',
    description: 'Tiny change with no unknowns.',
    examples: 'Fix a typo, change a color',
  },
  '2': {
    title: 'Small',
    description: 'Simple and well-understood task.',
    examples: 'Add a form field, rename a column',
  },
  '3': {
    title: 'Moderate',
    description: 'Straightforward work that touches a few files.',
    examples: 'New API endpoint, simple component',
  },
  '5': {
    title: 'Medium',
    description: 'Meaningful complexity with minor unknowns.',
    examples: 'Multi-step form, third-party integration',
  },
  '8': {
    title: 'Large',
    description: 'Significant effort with multiple moving parts.',
    examples: 'Real-time notifications, RBAC',
  },
  '13': {
    title: 'Very Large',
    description: 'Complex task that should likely be broken down.',
    examples: 'Major refactor, reporting dashboard',
  },
  '21': {
    title: 'Epic',
    description: 'Too large for one sprint, must be split.',
    examples: 'Full auth system, DB migration',
  },
  '?': {
    title: 'Unsure',
    description: 'Needs more info or spike before sizing.',
    examples: 'Unknown dependencies, unclear requirements',
  },
};

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  const backLink = session ? `/session/${session}` : '/';
  const backText = session ? 'Back to session' : 'Back to home';

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Story Points Guide</h1>
        <p className="mt-2 text-foreground/60">
          Understanding what each Fibonacci value represents
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {CARD_VALUES.map((value) => {
          const info = POINT_DESCRIPTIONS[value];
          return (
            <div
              key={value}
              className="flex flex-col gap-3 rounded-xl border border-border bg-muted p-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-xl font-bold text-accent-foreground">
                  {value}
                </div>
                <h2 className="text-xl font-semibold">{info.title}</h2>
              </div>
              <p className="text-foreground/80">{info.description}</p>
              <p className="text-sm text-foreground/60">
                <span className="font-medium">Examples:</span> {info.examples}
              </p>
            </div>
          );
        })}
      </div>

      <Link
        href={backLink}
        className="self-center text-sm text-accent hover:underline"
      >
        {backText}
      </Link>
    </div>
  );
}
