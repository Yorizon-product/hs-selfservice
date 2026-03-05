import { NextRequest, NextResponse } from "next/server";

const HUBSPOT_API = "https://api.hubapi.com";

type ContactInput = { firstname: string; lastname: string; email: string };
type CompanyInput = { name: string; domain: string; contact: ContactInput };

type CreatedEntity = {
  type: string;
  id: string;
  name: string;
  url: string;
};

/**
 * POST /api/create
 *
 * Creates: partner company, partner contact, customer company, customer contact,
 * then links contacts→companies and partner company↔customer company.
 */
export async function POST(req: NextRequest) {
  console.log("[create] POST /api/create called");
  try {
    const body = await req.json();
    console.log("[create] Request body:", JSON.stringify({
      ...body,
      token: body.token ? `${body.token.slice(0, 12)}...(len:${body.token.length})` : "MISSING",
    }, null, 2));
    const {
      token,
      partner,
      customer,
      associationLabelId,
      portalId,
    }: {
      token: string;
      partner: CompanyInput;
      customer: CompanyInput;
      associationLabelId: number;
      portalId: string | null;
    } = body;

    if (!token) {
      console.log("[create] ERROR: No token provided");
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }
    if (!partner?.name || !partner?.contact?.email) {
      console.log("[create] ERROR: Missing partner name or contact email");
      return NextResponse.json(
        { error: "Partner company name and contact email are required" },
        { status: 400 }
      );
    }
    if (!customer?.name || !customer?.contact?.email) {
      console.log("[create] ERROR: Missing customer name or contact email");
      return NextResponse.json(
        { error: "Customer company name and contact email are required" },
        { status: 400 }
      );
    }
    if (!associationLabelId) {
      console.log("[create] ERROR: Missing associationLabelId");
      return NextResponse.json(
        { error: "Association label ID is required" },
        { status: 400 }
      );
    }
    console.log("[create] Validation passed. associationLabelId:", associationLabelId, "portalId:", portalId);

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const created: CreatedEntity[] = [];
    const recordUrl = (type: string, id: string) =>
      portalId
        ? `https://app.hubspot.com/contacts/${portalId}/${type}/${id}`
        : `#${type}-${id}`;

    // ── 1. Create partner company ──
    console.log("[create] Step 1: Creating partner company:", partner.name);
    const partnerCompany = await createCompany(
      headers,
      partner.name,
      partner.domain,
      "partner"
    );
    console.log("[create] Step 1 done. Partner company ID:", partnerCompany.id);
    created.push({
      type: "Partner Company",
      id: partnerCompany.id,
      name: partner.name,
      url: recordUrl("company", partnerCompany.id),
    });

    // ── 2. Create partner contact + associate to company ──
    console.log("[create] Step 2: Creating partner contact:", partner.contact.email, "→ company", partnerCompany.id);
    const partnerContact = await createContact(
      headers,
      partner.contact,
      partnerCompany.id
    );
    console.log("[create] Step 2 done. Partner contact ID:", partnerContact.id);
    created.push({
      type: "Partner Contact",
      id: partnerContact.id,
      name: `${partner.contact.firstname} ${partner.contact.lastname}`.trim() || partner.contact.email,
      url: recordUrl("contact", partnerContact.id),
    });

    // ── 3. Create customer company ──
    console.log("[create] Step 3: Creating customer company:", customer.name);
    const customerCompany = await createCompany(
      headers,
      customer.name,
      customer.domain,
      "customer"
    );
    console.log("[create] Step 3 done. Customer company ID:", customerCompany.id);
    created.push({
      type: "Customer Company",
      id: customerCompany.id,
      name: customer.name,
      url: recordUrl("company", customerCompany.id),
    });

    // ── 4. Create customer contact + associate to company ──
    console.log("[create] Step 4: Creating customer contact:", customer.contact.email, "→ company", customerCompany.id);
    const customerContact = await createContact(
      headers,
      customer.contact,
      customerCompany.id
    );
    console.log("[create] Step 4 done. Customer contact ID:", customerContact.id);
    created.push({
      type: "Customer Contact",
      id: customerContact.id,
      name: `${customer.contact.firstname} ${customer.contact.lastname}`.trim() || customer.contact.email,
      url: recordUrl("contact", customerContact.id),
    });

    // ── 5. Associate partner company ↔ customer company with label ──
    console.log("[create] Step 5: Associating companies", partnerCompany.id, "↔", customerCompany.id, "with label", associationLabelId);
    await associateCompanies(
      headers,
      partnerCompany.id,
      customerCompany.id,
      associationLabelId
    );
    console.log("[create] Step 5 done. Association created.");
    created.push({
      type: "Association",
      id: `${partnerCompany.id}↔${customerCompany.id}`,
      name: `${partner.name} ↔ ${customer.name}`,
      url: recordUrl("company", partnerCompany.id),
    });

    console.log("[create] All steps complete. Created entities:", JSON.stringify(created, null, 2));
    return NextResponse.json({ created });
  } catch (e: any) {
    console.error("[create] Unhandled exception:", e.message, e.stack);
    return NextResponse.json(
      { error: e.message || "Internal error" },
      { status: 500 }
    );
  }
}

/* ── HubSpot API helpers ── */

async function hubspotFetch(
  url: string,
  headers: Record<string, string>,
  body: any
) {
  console.log("[hubspotFetch] POST", url);
  console.log("[hubspotFetch] Request body:", JSON.stringify(body, null, 2));
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log("[hubspotFetch] Response status:", res.status, res.statusText);
  console.log("[hubspotFetch] Response body:", text);
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`HubSpot returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const msg =
      data?.message || data?.errors?.[0]?.message || `HTTP ${res.status}`;
    console.error("[hubspotFetch] ERROR:", msg, "Full response:", JSON.stringify(data, null, 2));
    throw new Error(`HubSpot API error: ${msg}`);
  }
  return data;
}

async function createCompany(
  headers: Record<string, string>,
  name: string,
  domain: string,
  companytype: "partner" | "customer"
) {
  const properties: Record<string, string> = { name, companytype };
  if (domain) properties.domain = domain;

  return hubspotFetch(
    `${HUBSPOT_API}/crm/v3/objects/companies`,
    headers,
    { properties }
  );
}

async function createContact(
  headers: Record<string, string>,
  contact: ContactInput,
  companyId: string
) {
  const properties: Record<string, string> = { email: contact.email };
  if (contact.firstname) properties.firstname = contact.firstname;
  if (contact.lastname) properties.lastname = contact.lastname;

  // Create contact with inline association to company
  return hubspotFetch(
    `${HUBSPOT_API}/crm/v3/objects/contacts`,
    headers,
    {
      properties,
      associations: [
        {
          to: { id: companyId },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: 1, // contact → company default
            },
          ],
        },
      ],
    }
  );
}

async function associateCompanies(
  headers: Record<string, string>,
  fromId: string,
  toId: string,
  labelTypeId: number
) {
  // v4 associations API for labeled associations
  return hubspotFetch(
    `${HUBSPOT_API}/crm/v4/objects/companies/${fromId}/associations/companies/${toId}`,
    headers,
    [
      {
        associationCategory: "USER_DEFINED",
        associationTypeId: labelTypeId,
      },
    ]
  );
}
