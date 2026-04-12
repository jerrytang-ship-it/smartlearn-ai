"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LearnTab from "@/components/LearnTab";
import ChapterMap from "@/components/ChapterMap";
import { MascotBubble } from "@/components/Mascot";

function HomeContent() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get("unit");

  // If a unit ID is in the URL, show the winding path for that unit
  if (unitId) {
    return <ChapterMap focusUnitId={parseInt(unitId, 10)} />;
  }

  // Otherwise show the main Learn tab with grid + daily challenge
  return <LearnTab />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <MascotBubble message="載入中..." mood="thinking" mascotSize={64} />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
