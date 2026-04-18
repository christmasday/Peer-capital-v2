import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

function validateAndFormatBody(body: any) {
  // Required top-level fields
  const requiredFields = [
    "bvn",
    "nin",
    "phoneNumber",
    "emailAddress",
    "residentialAddress",
    "liveImageOfFace",
  ];
  for (const field of requiredFields) {
    if (!body[field]) {
      return { error: `Missing required field: ${field}` };
    }
  }

  // Required residentialAddress fields
  const addressFields = [
    "buildingNumber",
    "apartment",
    "street",
    "city",
    "town",
    "state",
    "lga",
    "lcda",
    "landmark",
    "additionalInformation",
    "country",
    "fullAddress",
    "postalCode",
  ];
  for (const field of addressFields) {
    if (!body.residentialAddress[field]) {
      return { error: `Missing required address field: ${field}` };
    }
  }

  // Return formatted body
  return {
    bvn: body.bvn,
    nin: body.nin,
    phoneNumber: body.phoneNumber,
    emailAddress: body.emailAddress,
    residentialAddress: {
      buildingNumber: body.residentialAddress.buildingNumber,
      apartment: body.residentialAddress.apartment,
      street: body.residentialAddress.street,
      city: body.residentialAddress.city,
      town: body.residentialAddress.town,
      state: body.residentialAddress.state,
      lga: body.residentialAddress.lga,
      lcda: body.residentialAddress.lcda,
      landmark: body.residentialAddress.landmark,
      additionalInformation: body.residentialAddress.additionalInformation,
      country: body.residentialAddress.country,
      fullAddress: body.residentialAddress.fullAddress,
      postalCode: body.residentialAddress.postalCode,
    },
    liveImageOfFace: body.liveImageOfFace,
  };
}

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req) as any;
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const formatted = validateAndFormatBody(body);
    if (formatted.error) {
      return NextResponse.json({ status: "error", message: formatted.error }, { status: 400 });
    }

    // Forward request to Alat API (Partnership Account with Address Verification)
    const response = await fetch(
      "https://apiplayground.alat.ng/wallet-creation/api/CustomerAccount/GeneratePartnershipAccount",
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.ALAT_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formatted),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", message: data.message || "Failed to create partnership account" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 