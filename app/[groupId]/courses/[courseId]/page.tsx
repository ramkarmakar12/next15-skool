import { notFound } from "next/navigation";
import { CourseBuilder } from "./_components/course-builder";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; courseId: string }> | { groupId: string; courseId: string }
}) {
  // Await params before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { groupId, courseId } = resolvedParams;

  if (!groupId || !courseId) {
    notFound();
  }

  return (
    <div className="h-full flex flex-col">
      <CourseBuilder 
        groupId={groupId} 
        courseId={courseId} 
      />
    </div>
  );
}
