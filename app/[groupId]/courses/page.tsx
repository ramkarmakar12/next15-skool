import { notFound } from "next/navigation";
import { CoursesList } from "./_components/courses-list";

export default function CoursesPage({ 
  params 
}: { 
  params: { groupId: string } 
}) {
  const groupId = params.groupId;

  if (!groupId) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full p-6">
      <h1 className="text-2xl font-bold mb-6">Courses</h1>
      <CoursesList groupId={groupId} />
    </div>
  );
}
