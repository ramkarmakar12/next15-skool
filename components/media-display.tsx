import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FileText, Film } from 'lucide-react';

interface MediaDisplayProps {
  mediaUrls: string[];
  mediaTypes: string[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MediaDisplay = ({
  mediaUrls,
  mediaTypes,
  className,
  size = 'md',
}: MediaDisplayProps) => {
  if (!mediaUrls || mediaUrls.length === 0) return null;

  // Size classes for different container sizes
  const sizeClasses = {
    sm: "grid-cols-2 gap-1 max-h-[200px]",
    md: "grid-cols-2 gap-2 max-h-[300px]",
    lg: "grid-cols-3 gap-3 max-h-[400px]"
  };

  // Determine grid layout based on the number of items
  const getGridClass = () => {
    if (mediaUrls.length === 1) return "grid-cols-1";
    if (mediaUrls.length === 2) return "grid-cols-2";
    if (mediaUrls.length === 3) return "grid-cols-3";
    if (mediaUrls.length === 4) return "grid-cols-2";
    return sizeClasses[size];
  };

  return (
    <div className={cn("grid overflow-hidden rounded-md", getGridClass(), className)}>
      {mediaUrls.map((url, index) => {
        const type = mediaTypes[index] || 'image';
        
        // Handle different media types
        if (type === 'image' || type === 'gif') {
          return (
            <div 
              key={index} 
              className={cn(
                "relative overflow-hidden", 
                index === 0 && mediaUrls.length === 3 ? "col-span-3" : "",
                index === 0 && mediaUrls.length >= 4 ? "row-span-2 col-span-2" : "",
                mediaUrls.length >= 5 && index < 4 ? "aspect-square" : ""
              )}
            >
              <Image
                src={url}
                alt={`Media ${index + 1}`}
                layout="fill"
                objectFit="cover"
                className="hover:scale-105 transition-transform duration-200"
              />
              {/* Display overlay with count if there are more than 4 images and this is the 4th */}
              {index === 3 && mediaUrls.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">+{mediaUrls.length - 4}</span>
                </div>
              )}
            </div>
          );
        } else if (type === 'video') {
          return (
            <div key={index} className="relative overflow-hidden aspect-video">
              <video
                src={url}
                controls
                className="w-full h-full object-cover"
              />
            </div>
          );
        } else {
          // Document or other file types
          return (
            <div key={index} className="flex items-center justify-center p-4 bg-gray-100 rounded-md">
              <FileText className="mr-2 h-6 w-6 text-gray-500" />
              <span className="text-sm text-gray-700 truncate">Document</span>
            </div>
          );
        }
      })}
    </div>
  );
};
