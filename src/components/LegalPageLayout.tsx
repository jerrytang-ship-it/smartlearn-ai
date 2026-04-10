"use client";

import Link from "next/link";
import { ReactNode } from "react";

export default function LegalPageLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="px-4 pb-28 pt-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="text-[#A0907E] hover:text-[#2D2D2D]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-extrabold text-[#2D2D2D]">{title}</h1>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-[#F0E8E0] shadow-sm prose-sm max-w-none">
        {children}
      </div>
    </div>
  );
}
