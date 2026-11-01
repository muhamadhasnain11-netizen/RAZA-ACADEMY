import { NextResponse } from "next/server";
import { userClient, daily, NOT_SETUP } from "../../../lib/serverAuth";

export const dynamic = "force-dynamic";
const fail = (error, status) => NextResponse.json({ error }, { status });

export async function GET(req) {
  if (!process.env.DAILY_API_KEY) return NextResponse.json(NOT_SETUP, { status: 503 });
  const u = userClient(req);
  if (!u) return fail("Please log in.", 401);
  const id = new URL(req.url).searchParams.get("s");
  const { data: s } = await u.db.from("sessions").select("id").eq("id", id).maybeSingle();
  if (!s) return fail("You do not have access to this class.", 404);

  const list = await daily(`/recordings?room_name=raza-${s.id}`);
  const rec = list.ok ? ((await list.json()).data || []).filter((r) => r.status === "finished").sort((a, b) => b.start_ts - a.start_ts)[0] : null;
  if (!rec) return fail("No recording is available for this class.", 404);
  const a = await daily(`/recordings/${rec.id}/access-link`);
  if (!a.ok) return fail("Could not open the recording. Please try again.", 502);
  const { download_link } = await a.json();
  return NextResponse.json({ url: download_link });
}
