"use client";
import dynamic from "next/dynamic";

// wrapper client-only
const HomeClientPage = dynamic(() => import("./HomeClientPage"), { ssr: false });

export default function Page() {
    return <HomeClientPage />;
}