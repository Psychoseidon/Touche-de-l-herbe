import { prisma } from "@/lib/prisma";

export const MONTHLY_GOAL_CENTS = 50000; // 500 € — objectif mensuel affiché (cf. cahier des charges 7.3)
export const MONTHLY_INFRA_COST_CENTS = 12000; // 120 € — hébergement Vercel + base de données + services tiers

export async function getFinancesSummary() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalAgg, monthAgg, donationCount] = await Promise.all([
    prisma.donation.aggregate({ _sum: { amount: true } }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.donation.count(),
  ]);

  const totalCents = totalAgg._sum.amount ?? 0;
  const monthCents = monthAgg._sum.amount ?? 0;
  const progress = Math.min(100, Math.round((monthCents / MONTHLY_GOAL_CENTS) * 100));

  return {
    totalCents,
    monthCents,
    donationCount,
    progress,
    monthlyGoalCents: MONTHLY_GOAL_CENTS,
    monthlyInfraCostCents: MONTHLY_INFRA_COST_CENTS,
  };
}
