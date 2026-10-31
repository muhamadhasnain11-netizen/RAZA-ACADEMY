"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";

// null = checking, false = not allowed, otherwise allowed (teacher returns the teacher row).
export function useGuard(kind) {
  const router = useRouter();
  const [ok, setOk] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace(`/${kind}/login`); return; }
      const email = data.user.email.toLowerCase();
      if (kind === "client") { const a = await supabase.from("admins").select("email").maybeSingle(); setOk(!!a.data); }
      else if (kind === "teacher") { const t = await supabase.from("teachers").select("*").eq("email", email).maybeSingle(); setOk(t.data || false); }
      else setOk(data.user);
    })();
  }, [kind, router]);
  return ok;
}
