import { notFound } from "next/navigation";
import { CoursesList } from "./_components/courses-list";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ groupId: string }> | { groupId: string }
}) {
  // Await params before accessing properties
  const resolvedParams = await Promise.resolve(params);
  const groupId = resolvedParams.groupId;

  if (!groupId) {
    notFound();
  }

  return (
    <div className="h-full p-6">
      <CoursesList groupId={groupId} />
    </div>
  );
}
