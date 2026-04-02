import LessonPlayer from "@/components/LessonPlayer";

export default async function Lesson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonPlayer chapterId={parseInt(id, 10)} />;
}
