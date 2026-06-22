import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModerationRow } from "@/components/moderation-row";

const CATEGORY_LABELS: Record<string, string> = {
  FAKE_PROFILE: "Faux profil",
  HARASSMENT: "Harcèlement",
  INAPPROPRIATE_BEHAVIOR: "Comportement inapproprié",
  ILLEGAL_CONTENT: "Contenu illicite",
};

export default async function ModerationPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me?.isAdmin) redirect("/");

  const reports = await prisma.report.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { pseudo: true } },
      reported: { select: { id: true, pseudo: true } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">
        Queue de modération ({reports.length})
      </h1>

      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  <Link href={`/profile/${report.reported.id}`} className="underline">
                    {report.reported.pseudo}
                  </Link>
                </CardTitle>
                <Badge variant="destructive">
                  {CATEGORY_LABELS[report.category]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Signalé par {report.reporter.pseudo} le{" "}
                {report.createdAt.toLocaleDateString("fr-FR")}
              </p>
              {report.details && <p className="text-sm">{report.details}</p>}
              <ModerationRow reportId={report.id} />
            </CardContent>
          </Card>
        ))}

        {reports.length === 0 && (
          <p className="text-muted-foreground">Aucun signalement en attente.</p>
        )}
      </div>
    </div>
  );
}
