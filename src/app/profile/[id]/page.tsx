import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportButton } from "@/components/report-button";
import { ProfileBlog } from "@/components/profile-blog";
import { getAge } from "@/lib/age";
import { parsePhotos, parseInterests } from "@/lib/profile";

const LOOKING_FOR_LABEL: Record<string, string> = {
  FRIENDLY: "Cherche des amitiés",
  ROMANTIC: "Cherche une relation",
  BOTH: "Ouvert·e aux deux",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      pseudo: true,
      photo: true,
      photos: true,
      bio: true,
      interests: true,
      lookingFor: true,
      birthDate: true,
      verified: true,
      createdAt: true,
      _count: { select: { createdEvents: true, participants: true } },
      posts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;
  const age = getAge(user.birthDate);
  const photos = parsePhotos(user.photos);
  const interests = parseInterests(user.interests);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.photo ?? undefined} alt={user.pseudo} />
            <AvatarFallback>{user.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {user.pseudo}
              {age !== null && <span className="text-muted-foreground">, {age}</span>}
              {user.verified && (
                <Badge variant="secondary">Profil vérifié</Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Membre depuis {user.createdAt.toLocaleDateString("fr-FR")}
            </p>
            {user.lookingFor && (
              <Badge variant="outline" className="mt-2">
                {LOOKING_FOR_LABEL[user.lookingFor]}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {photos.length > 0 && (
            <div className="flex gap-2">
              {photos.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={photo}
                  alt={`${user.pseudo} ${i + 2}`}
                  className="h-24 w-24 rounded-md object-cover"
                />
              ))}
            </div>
          )}
          {user.bio && <p>{user.bio}</p>}
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge key={interest} variant="outline">
                  {interest}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>{user._count.createdEvents} rencontres créées</span>
            <span>{user._count.participants} rencontres rejointes</span>
          </div>
          {isOwnProfile && (
            <Badge variant={user.lookingFor ? "secondary" : "destructive"}>
              {user.lookingFor ? "Présentation complète" : "Présentation incomplète"}
            </Badge>
          )}
          {!isOwnProfile && session?.user && (
            <ReportButton reportedId={user.id} />
          )}
        </CardContent>
      </Card>

      <ProfileBlog
        isOwnProfile={isOwnProfile}
        initialPosts={user.posts.map((post) => ({
          ...post,
          createdAt: post.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
