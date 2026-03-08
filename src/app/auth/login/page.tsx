"use client";

import { Suspense } from "react";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
        <SiteNavbar />
        <main className="mx-auto flex max-w-6xl flex-col items-center px-6 py-10">
      <LoginForm />
        </main>
        <HomeFooter />
      </div>
    </Suspense>
  );
}
