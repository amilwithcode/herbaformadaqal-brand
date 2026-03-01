import { NextResponse } from "next/server";
import { getRecommendedProducts } from "@/modules/products/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getRecommendedProducts(3); // Limit to 3 for the About page section
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
