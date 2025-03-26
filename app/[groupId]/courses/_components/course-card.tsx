"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { Doc } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

interface CourseCardProps {
  course: Doc<"courses">;
  groupId: Id<"groups">;
}

export const CourseCard = ({
  course,
  groupId
}: CourseCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/${groupId}/courses/${course._id}`);
  };

  return (
    <Card 
      className="flex flex-col hover:shadow-md transition cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="p-4 border-b">
        <div className="font-semibold truncate">{course.name}</div>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {course.description || "No description"}
        </p>
      </CardContent>
      <CardFooter className="p-4 text-xs text-muted-foreground flex justify-between">
        <div>
          {course.published ? (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              Published
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
              Draft
            </span>
          )}
        </div>
        <div>
          {course.updatedAt ? (
            `Updated ${formatDistanceToNow(course.updatedAt, { addSuffix: true })}`
          ) : (
            `Created ${formatDistanceToNow(course.createdAt, { addSuffix: true })}`
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
