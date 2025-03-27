import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface CourseCardProps {
    title: string;
    description: string;
    thumbnailStorageId: string;
    groupId: Id<"groups">;
    courseId: Id<"courses">;
};

export const CourseCard = ({
    title,
    description,
    thumbnailStorageId,
    groupId,
    courseId,
}: CourseCardProps) => {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/${groupId}/classroom/${courseId}`);
    };

    // Determine the image source - use the thumbnail if available, otherwise fallback to logo
    const imageSrc = thumbnailStorageId 
        ? `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${thumbnailStorageId}`
        : "/logo.svg";

    return (
        <div className="group hover:shadow-md transition overflow-hidden border rounded-lg p-3 h-full">
            <div className="h-[200px] relative">
                <Image 
                    src={imageSrc}
                    fill 
                    alt={`${title} course thumbnail`}
                    className="object-cover"
                />
            </div>
            <div className="flex flex-col pt-2">
                <div className="text-lg md:text-xl font-medium group-hover:text-sky-700 transition line-clamp-2">
                    {title}
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                    {description}
                </p>
                <div className="mt-auto pt-2">
                    <Button
                        onClick={handleClick}
                        className="w-full mt-4"
                    >
                        View Course
                    </Button>
                </div>
            </div>
        </div>
    );
};