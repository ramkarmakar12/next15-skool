import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/spinner";
import { CourseBuilder } from "./_components/course-builder";
import { CourseContent } from "./_components/course-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CourseDetailPageProps {
  params: {
    courseId: string;
    groupId: string;
  };
}

export default async function CourseDetailPage({
  params
}: CourseDetailPageProps) {
  const user = await currentUser();

  if (!user) {
    return redirect("/");
  }

  const courseId = params.courseId as Id<"courses">;
  const groupId = params.groupId as Id<"groups">;

  return (
    <div className="h-full p-6">
      <Tabs defaultValue="content">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="content">Course Content</TabsTrigger>
            <TabsTrigger value="builder">Course Builder</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="content" className="mt-0">
          <CourseContent 
            courseId={courseId}
            groupId={groupId}
          />
        </TabsContent>
        <TabsContent value="builder" className="mt-0">
          <CourseBuilder 
            courseId={courseId}
            groupId={groupId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
