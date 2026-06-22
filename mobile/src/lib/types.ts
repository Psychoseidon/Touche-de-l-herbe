export type LookingFor = "FRIENDLY" | "ROMANTIC" | "BOTH";

export type User = {
  id: string;
  pseudo: string;
  name: string;
  photo: string | null;
  bio?: string | null;
  verified: boolean;
  profileCompletedAt?: string | null;
};

export type EventParticipant = {
  id: string;
  userId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  user?: { id: string; pseudo: string; photo: string | null };
};

export type Event = {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  minSize: number;
  maxSize: number;
  radius: "local" | "national";
  autoAccept: boolean;
  creatorId: string;
  creator: { id: string; pseudo: string; photo: string | null };
  participants: EventParticipant[];
};

export type Candidate = {
  id: string;
  pseudo: string;
  photo: string | null;
  photos: string[];
  bio: string | null;
  age: number | null;
  interests: string[];
  lookingFor: LookingFor | null;
};

export type Group = {
  id: string;
  eventId: string;
  createdAt: string;
  lastActiveAt: string;
  event: { title: string; location: string };
  members: { userId: string }[];
};

export type ProfilePost = {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; pseudo: string; photo: string | null };
};
