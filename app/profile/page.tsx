import Link from "next/link";
import { ArrowLeft, UserCircle } from "lucide-react";
import { ProfileClient } from "@/components/profile-page";

export const metadata = { title: "My Profile — InternConnect" };

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"><ArrowLeft className="h-4 w-4" /> Back to listings</Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><UserCircle className="h-5 w-5" /></div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My profile</h1>
      </div>
      <ProfileClient />
    </main>
  );
}
