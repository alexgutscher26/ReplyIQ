import { type auth } from ".";

export type Session = typeof auth.$Infer.Session & {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
    role: string;
  };
};
export type User = Session["user"];
