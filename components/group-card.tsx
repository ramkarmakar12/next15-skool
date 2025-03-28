import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { Users } from "lucide-react";
import Link from "next/link";

interface GroupCardProps {
  id: Id<"groups">;
  name: string;
  description: string;
  members: number;
  category?: string;
  rank?: number;
}

export const GroupCard = ({
  id,
  name,
  description,
  members,
  category = "General",
  rank
}: GroupCardProps) => {
  // Function to get category badge color
  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase();
    switch(lowerCategory) {
      case "hobbies": return "bg-yellow-100 text-yellow-800";
      case "music": return "bg-purple-100 text-purple-800";
      case "money": return "bg-green-100 text-green-800";
      case "spirituality": return "bg-blue-100 text-blue-800";
      case "tech": return "bg-gray-100 text-gray-800";
      case "health": return "bg-red-100 text-red-800";
      case "sports": return "bg-orange-100 text-orange-800";
      case "self-improvement": return "bg-indigo-100 text-indigo-800";
      default: 
        // Generate a consistent color for custom categories based on the first letter
        const firstChar = category.charAt(0).toLowerCase();
        const charCode = firstChar.charCodeAt(0);
        const hue = (charCode * 15) % 360;
        return `bg-[hsl(${hue},85%,90%)] text-[hsl(${hue},85%,30%)]`;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    switch(lowerCategory) {
      case "hobbies": return "🎨";
      case "music": return "🎵";
      case "money": return "💰";
      case "spirituality": return "🧘";
      case "tech": return "💻";
      case "health": return "🏥";
      case "sports": return "⚽";
      case "self-improvement": return "📈";
      case "general": return "🌐";
      default: return "🏷️"; // Default icon for custom categories
    }
  };

  return (
    <Link href={`/${id}`}>
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
        {rank && (
          <div className="absolute top-2 left-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            #{rank}
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{name}</CardTitle>
            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(category)}`}>
              {getCategoryIcon(category)} {category}
            </span>
          </div>
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>{members} {members === 1 ? "member" : "members"}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};