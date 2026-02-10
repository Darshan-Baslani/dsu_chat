import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const BOT_EMAIL = "deadline-bot@lms.internal";
const BOT_NAME = "Deadline Reminder";

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 500 }
    );
  }

  const { studentId, studentName, assignmentTitle, roomName } =
    (await req.json()) as {
      studentId: string;
      studentName: string;
      assignmentTitle: string;
      roomName: string;
    };

  if (!studentId || !assignmentTitle) {
    return NextResponse.json(
      { error: "studentId and assignmentTitle are required" },
      { status: 400 }
    );
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // ── 1. Ensure the bot user + profile exists ──────────────────────
    let botUserId: string;

    const { data: botProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", BOT_EMAIL)
      .maybeSingle();

    if (botProfile) {
      botUserId = botProfile.id;
    } else {
      // Create an auth user; the on_auth_user_created trigger auto-creates the profile
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email: BOT_EMAIL,
          password: crypto.randomUUID(), // random — never used for login
          email_confirm: true,
          user_metadata: { full_name: BOT_NAME, role: "teacher" },
        });

      if (createErr) {
        return NextResponse.json(
          { error: `Bot user creation failed: ${createErr.message}` },
          { status: 500 }
        );
      }
      botUserId = created.user.id;
    }

    // ── 2. Find or create a DM room between bot & student ────────────
    let dmRoomId: string | null = null;

    // Get rooms the bot belongs to
    const { data: botMemberships } = await admin
      .from("room_members")
      .select("room_id")
      .eq("user_id", botUserId);

    const botRoomIds = (botMemberships ?? []).map((m) => m.room_id);

    if (botRoomIds.length > 0) {
      // Check if student shares a 'direct' room with the bot
      const { data: sharedRoom } = await admin
        .from("room_members")
        .select("room_id, rooms!inner(type)")
        .eq("user_id", studentId)
        .in("room_id", botRoomIds)
        .eq("rooms.type" as string, "direct")
        .limit(1)
        .maybeSingle();

      if (sharedRoom) {
        dmRoomId = sharedRoom.room_id;
      }
    }

    if (!dmRoomId) {
      // Create a new DM room
      const { data: newRoom, error: roomErr } = await admin
        .from("rooms")
        .insert({
          name: BOT_NAME,
          type: "direct",
          created_by: botUserId,
        })
        .select("id")
        .single();

      if (roomErr) {
        return NextResponse.json(
          { error: `Room creation failed: ${roomErr.message}` },
          { status: 500 }
        );
      }

      dmRoomId = newRoom.id;

      // Add bot + student as members
      await admin.from("room_members").insert([
        { room_id: dmRoomId, user_id: botUserId },
        { room_id: dmRoomId, user_id: studentId },
      ]);
    }

    // ── 3. Send the private notification ─────────────────────────────
    const content = `Hi ${studentName ?? "there"}, you missed the deadline for "${assignmentTitle}" in ${roomName ?? "your class"}. Please submit your work as soon as possible.`;

    const { error: msgErr } = await admin.from("messages").insert({
      room_id: dmRoomId,
      sender_id: botUserId,
      content,
      message_type: "text",
      metadata: {},
    });

    if (msgErr) {
      return NextResponse.json(
        { error: `Message send failed: ${msgErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, dmRoomId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
