import { NextResponse } from "next/server";
import { userClient, daily, NOT_SETUP } from "../../../lib/serverAuth";

export const dynamic = "force-dynamic";
const fail = (error, status) => NextResponse.json({ error }, { status });

export async function POST(req) {
  if (!process.env.DAILY_API_KEY) return NextResponse.json(NOT_SETUP, { status: 503 });
  const u = userClient(req);
  if (!u) return fail("Please log in.", 401);
  const { sessionId } = await req.json();
  const { data: auth } = await u.db.auth.getUser(u.token);
  const user = auth && auth.user;
  if (!user) return fail("Please log in again.", 401);

  const { data: s } = await u.db.from("sessions").select("*, classes(name, teacher_email)").eq("id", sessionId).maybeSingle();
  if (!s) return fail("You do not have access to this class.", 404);

  const email = (user.email || "").toLowerCase();
  const adm = await u.db.from("admins").select("email").maybeSingle();
  const owner = !!adm.data || (s.classes && s.classes.teacher_email.toLowerCase() === email);

  const start = new Date(s.starts_at).getTime(), now = Date.now();
  if (now < start - 20 * 60e3) return fail("This class opens 20 minutes before it starts.", 403);
  if (s.checked_out_at || now > start + 4 * 36e5) return fail("This class has ended.", 403);
  if (!owner) {
    if (!s.checked_in_at) return fail("Waiting for the teacher to start the class. Try again in a moment.", 403);
    const r = await u.db.rpc("join_session", { sid: s.id });
    if (r.error) return fail("You cannot join this class.", 403);
  }

  const name = `raza-${s.id}`;
  let room;
  const g = await daily(`/rooms/${name}`);
  if (g.ok) room = await g.json();
  else {
    const c = await daily("/rooms", { method: "POST", body: JSON.stringify({ name, privacy: "private", properties: { enable_screenshare: true, enable_chat: true, enable_recording: "cloud", exp: Math.floor(now / 1000) + 24 * 3600 } }) });
    if (!c.ok) return fail("Could not open the classroom. Please try again.", 502);
    room = await c.json();
  }
  const t = await daily("/meeting-tokens", { method: "POST", body: JSON.stringify({ properties: { room_name: name, user_name: (user.user_metadata && user.user_metadata.full_name) || email, is_owner: owner, exp: Math.floor(now / 1000) + 4 * 3600 } }) });
  if (!t.ok) return fail("Could not create your class pass. Please try again.", 502);
  const { token } = await t.json();
  return NextResponse.json({ url: `${room.url}?t=${token}`, owner });
}
