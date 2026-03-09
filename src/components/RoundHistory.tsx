'use client';

import { useVotingStore } from '@/store/useVotingStore';

export default function RoundHistory() {
  const rounds = useVotingStore((s) => s.rounds);

  if (rounds.length === 0) return null;

  return (
    <section aria-label="Round history">
      <h2 className="mb-3 text-sm font-semibold text-foreground/60 uppercase tracking-wide">
        Round History
      </h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-foreground/5">
              <th className="px-4 py-2.5 text-left font-medium text-foreground/60 w-12">
                #
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-foreground/60">
                Task
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-foreground/60 w-24">
                Consensus
              </th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((round) => (
              <tr
                key={round.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-2.5 text-foreground/40">
                  {round.round_number}
                </td>
                <td className="px-4 py-2.5 text-foreground">
                  {round.task_name}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-accent">
                  {round.consensus_value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
