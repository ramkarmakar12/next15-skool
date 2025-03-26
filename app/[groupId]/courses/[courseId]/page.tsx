import { notFound } from "next/navigation";
import { CourseBuilder } from "./_components/course-builder";

export default function CourseDetailPage({ 
  params 
}: { 
  params: { groupId: string; courseId: string } 
}) {
  const { groupId, courseId } = params;

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
