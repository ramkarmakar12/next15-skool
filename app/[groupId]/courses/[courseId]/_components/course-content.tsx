"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/spinner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

interface CourseContentProps {
  courseId: Id<"courses">;
  groupId: Id<"groups">;
}

export const CourseContent = ({
  courseId,
  groupId,
}: CourseContentProps) => {
  const course = useQuery(api.courses.get, { id: courseId });
  const modules = useQuery(api.courseModules.list, { courseId });
  
  // Get all content items for all modules at once
  const allContents = useQuery(api.courseContents.listAll, { courseId }) || [];
  
  // Organize contents by moduleId for easier access
  const contentsByModule = useMemo(() => {
    const result = {};
    allContents.forEach(content => {
      if (!result[content.moduleId]) {
        result[content.moduleId] = [];
      }
      result[content.moduleId].push(content);
    });
    return result;
  }, [allContents]);
  
  const [expandedContentId, setExpandedContentId] = useState<Id<"courseContents"> | null>(null);

  const toggleContentExpand = (contentId: Id<"courseContents">) => {
    if (expandedContentId === contentId) {
      setExpandedContentId(null);
    } else {
      setExpandedContentId(contentId);
    }
  };

  if (!course || !modules) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
        <p className="text-muted-foreground mb-4">{course.description}</p>
        <p>No content has been added to this course yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        {course.description && (
          <p className="text-muted-foreground mt-2">{course.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {modules.map((module) => {
          // Get contents for this module from our pre-organized map
          const moduleContents = contentsByModule[module._id] || [];
          
          return (
            <Accordion 
              type="single" 
              collapsible 
              key={module._id}
              className="bg-white rounded-lg border shadow-sm"
            >
              <AccordionItem value={module._id} className="border-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{module.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {moduleContents.length} {moduleContents.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-0">
                  <div className="p-4 space-y-4">
                    {module.description && (
                      <p className="text-sm text-muted-foreground">
                        {module.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      {moduleContents.map((content) => (
                        <div key={content._id} className="pl-6 mt-2">
                          <div className="flex items-center group relative">
                            <div className="flex items-center flex-1">
                              <div className="ml-2 text-sm flex-1">
                                <div className="flex items-center">
                                  <span className="font-medium">{content.title}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="ml-2 h-6 w-6 p-0"
                                    onClick={() => toggleContentExpand(content._id)}
                                  >
                                    {expandedContentId === content._id ? 
                                      <ChevronDown className="h-4 w-4" /> : 
                                      <ChevronRight className="h-4 w-4" />
                                    }
                                  </Button>
                                </div>
                                {expandedContentId === content._id && (
                                  <div className="mt-2 pl-2 border-l-2 border-slate-200 text-slate-600">
                                    {content.type === "video" && (
                                      <div className="space-y-2">
                                        <div className="relative w-full pt-[56.25%] rounded-md overflow-hidden">
                                          <iframe 
                                            className="absolute top-0 left-0 w-full h-full"
                                            src={content.content.videoUrl?.replace("watch?v=", "embed/") || ""}
                                            title={content.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          ></iframe>
                                        </div>
                                        {content.content.description && (
                                          <p className="text-sm mt-2">{content.content.description}</p>
                                        )}
                                      </div>
                                    )}
                                    {content.type === "document" && (
                                      <div className="space-y-2">
                                        <div className="flex items-center">
                                          <a 
                                            href={content.content.fileUrl} 
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-blue-600 hover:text-blue-800"
                                          >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download {content.content.fileType || "Document"}
                                          </a>
                                        </div>
                                        {content.content.description && (
                                          <p className="text-sm mt-2">{content.content.description}</p>
                                        )}
                                      </div>
                                    )}
                                    {content.type === "text" && (
                                      <div className="prose prose-sm max-w-none">
                                        <p>{content.content.text}</p>
                                      </div>
                                    )}
                                    {content.type === "link" && (
                                      <div className="space-y-2">
                                        <a 
                                          href={content.content.url} 
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center text-blue-600 hover:text-blue-800"
                                        >
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          {content.content.url}
                                        </a>
                                        {content.content.description && (
                                          <p className="text-sm mt-2">{content.content.description}</p>
                                        )}
                                      </div>
                                    )}
                                    {content.type === "diagram" && (
                                      <div className="space-y-2">
                                        <div className="border rounded-md p-4 bg-gray-50">
                                          <img 
                                            src={content.content.fileUrl || "/placeholder-diagram.svg"} 
                                            alt={content.title}
                                            className="max-w-full h-auto"
                                          />
                                        </div>
                                        {content.content.description && (
                                          <p className="text-sm mt-2">{content.content.description}</p>
                                        )}
                                      </div>
                                    )}
                                    {content.type === "transcript" && (
                                      <div className="prose prose-sm max-w-none bg-gray-50 p-3 rounded-md">
                                        <p>{content.content.text}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        })}
      </div>
    </div>
  );
};