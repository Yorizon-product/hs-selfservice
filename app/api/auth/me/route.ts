import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userEmail) {
    return NextResponse.json({ loggedIn: false });
  }

  // Fetch portal ID for building HubSpot record URLs
  let portalId: string | null = null;
  const token = process.env.HUBSPOT_TOKEN;
  if (token) {
    try {
      const res = await fetch("https://api.hubapi.com/account-info/v3/details", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        portalId = String(data.portalId);
      }
    } catch {}
  }

  return NextResponse.json({ loggedIn: true, userEmail: session.userEmail, portalId });
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string" || !emailRegex.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const session = await getSession();
  session.userEmail = email.trim().toLowerCase();
  await session.save();

  console.log(`[audit] User identified: ${session.userEmail}`);
  return NextResponse.json({ loggedIn: true, userEmail: session.userEmail });
}

export async function DELETE() {
  const session = await getSession();
  const email = session.userEmail;
  session.destroy();
  console.log(`[audit] User signed out: ${email}`);
  return NextResponse.json({ loggedIn: false });
}
