import { NextResponse } from "next/server";

/**
 * Web Bot Auth (RFC 9421 / HTTP Message Signatures)
 * Bu endpoint agentlərə saytın özünü identifikasiya etməsi üçün JWKS təqdim edir.
 */
export async function GET() {
  const jwks = {
    keys: [
      {
        kty: "OKP",
        use: "sig",
        crv: "Ed25519",
        kid: "herba-bot-2026",
        x: "example-public-key-placeholder", // Real tətbiqdə burada real publik açar olmalıdır
        alg: "EdDSA",
      },
    ],
  };

  return NextResponse.json(jwks, {
    headers: {
      "Content-Type": "application/jwk-set+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
