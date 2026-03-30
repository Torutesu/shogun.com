"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/loading";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/chat");
    } else {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-light dark:bg-dark">
      <div className="text-center">
        <h1
          className="text-light-text dark:text-dark-text tracking-[0.12em]"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(5.5rem, 16vw, 14rem)" }}
        >
          SHOGUN
        </h1>
        <div className="mt-4 flex justify-center">
          <Spinner />
        </div>
      </div>
    </main>
  );
}
