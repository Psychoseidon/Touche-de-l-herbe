import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFinancesSummary } from "@/lib/finances";

export default async function FinancesPage() {
  const { totalCents, monthCents, donationCount, progress, monthlyGoalCents, monthlyInfraCostCents } =
    await getFinancesSummary();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Transparence financière</h1>
      <p className="mb-6 text-muted-foreground">
        Modèle Wikipedia : Touche de l&apos;herbe fonctionne uniquement grâce aux dons
        volontaires. Aucune donnée personnelle des donateurs n&apos;est
        affichée ici.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dons reçus (total)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(totalCents / 100).toFixed(2)} €</p>
            <p className="text-sm text-muted-foreground">
              {donationCount} don{donationCount > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coûts d&apos;infrastructure / mois</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(monthlyInfraCostCents / 100).toFixed(2)} €
            </p>
            <p className="text-sm text-muted-foreground">
              Hébergement, base de données, services tiers
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Objectif du mois</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {(monthCents / 100).toFixed(2)} € / {(monthlyGoalCents / 100).toFixed(2)} €
            {" "}({progress}%)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
