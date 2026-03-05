import { NextRequest, NextResponse } from "next/server";

const HUBSPOT_API = "https://api.hubapi.com";

export async function POST(req: NextRequest) {
  console.log("[labels] POST /api/labels called");
  try {
    const body = await req.json();
    console.log("[labels] Request body keys:", Object.keys(body));
    const { token } = body;
    if (!token) {
      console.log("[labels] ERROR: No token provided");
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }
    console.log("[labels] Token received, length:", token.length, "prefix:", token.slice(0, 12));

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Fetch company-to-company association labels
    const labelsUrl = `${HUBSPOT_API}/crm/v4/associations/companies/companies/labels`;
    console.log("[labels] Fetching association labels from:", labelsUrl);
    const labelsRes = await fetch(labelsUrl, { headers });
    console.log("[labels] Labels response status:", labelsRes.status, labelsRes.statusText);

    if (!labelsRes.ok) {
      const errText = await labelsRes.text();
      console.log("[labels] Labels response error body:", errText);
      let err: any = {};
      try { err = JSON.parse(errText); } catch {}
      return NextResponse.json(
        {
          error: `Failed to fetch labels: ${labelsRes.status} ${err?.message || ""}`,
        },
        { status: labelsRes.status }
      );
    }

    const labelsData = await labelsRes.json();
    console.log("[labels] Labels raw response:", JSON.stringify(labelsData, null, 2));

    // Also fetch portal ID for building record URLs
    let portalId: string | null = null;
    try {
      const meUrl = `${HUBSPOT_API}/account-info/v3/details`;
      console.log("[labels] Fetching portal info from:", meUrl);
      const meRes = await fetch(meUrl, { headers });
      console.log("[labels] Portal info response status:", meRes.status, meRes.statusText);
      if (meRes.ok) {
        const meData = await meRes.json();
        console.log("[labels] Portal info data:", JSON.stringify(meData, null, 2));
        portalId = String(meData.portalId);
      } else {
        const meErr = await meRes.text();
        console.log("[labels] Portal info error body:", meErr);
      }
    } catch (portalErr: any) {
      console.log("[labels] Portal info fetch exception:", portalErr.message);
    }

    // Map to a cleaner format
    const labels = (labelsData.results || []).map((r: any) => ({
      typeId: r.typeId,
      label: r.label || "",
      category: r.category || "HUBSPOT_DEFINED",
    }));
    console.log("[labels] Mapped labels:", JSON.stringify(labels));
    console.log("[labels] Portal ID:", portalId);

    return NextResponse.json({ labels, portalId });
  } catch (e: any) {
    console.error("[labels] Unhandled exception:", e.message, e.stack);
    return NextResponse.json(
      { error: e.message || "Internal error" },
      { status: 500 }
    );
  }
}
