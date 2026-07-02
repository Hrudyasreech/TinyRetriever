"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/client";
import { Workspace } from "@/components/research/workspace";

export default function DashboardPage() {
  useEffect(() => {
    async function test() {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("TOKEN:", session?.access_token);

      const res = await fetch("http://127.0.0.1:8000/me", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      console.log(await res.json());
    }

    test();
  }, []);

  return <Workspace />;
}