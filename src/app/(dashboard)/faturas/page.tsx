"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FaturasPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/financeiro/faturas"); }, [router]);
  return null;
}
