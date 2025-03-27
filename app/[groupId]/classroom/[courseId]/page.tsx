"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

const CourseClassroomPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as Id<"courses">;
  const groupId = params.groupId as Id<"groups">;
  
  const course = useQuery(api.courses.get, { id: courseId });
  const modules = useQuery(api.courseModules.list, { courseId });
  const allContents = useQuery(api.courseContents.listAll, { courseId }) || [];
  
  const [expandedModuleId, setExpandedModuleId] = useState<Id<"courseModules"> | null>(null);
  const [expandedContentId, setExpandedContentId] = useState<Id<"courseContents"> | null>(null);

  // Auto-expand the first module when data loads
  useEffect(() => {
    if (modules && modules.length > 0 && !expandedModuleId) {
      setExpandedModuleId(modules[0]._id);
    }
  }, [modules, expandedModuleId]);

  const toggleModule = (moduleId: Id<"courseModules">) => {
    setExpandedModuleId(expandedModuleId === moduleId ? null : moduleId);
  };

  const toggleContent = (contentId: Id<"courseContents">) => {
    setExpandedContentId(expandedContentId === contentId ? null : contentId);
  };

  // Function to navigate to course builder
  const navigateToCourseBuilder = () => {
    router.push(`/${groupId}/courses/${courseId}?tab=builder`);
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
        <Button 
          onClick={navigateToCourseBuilder}
          className="mt-4"
          variant="outline"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit in Course Builder
        </Button>
      </div>
    );
  }

  // Organize contents by moduleId for easier access
  const contentsByModule = {};
  allContents.forEach(content => {
    if (!contentsByModule[content.moduleId]) {
      contentsByModule[content.moduleId] = [];
    }
    contentsByModule[content.moduleId].push(content);
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="text-muted-foreground mt-2">{course.description}</p>
          )}
        </div>
        <Button 
          onClick={navigateToCourseBuilder}
          variant="outline"
          size="sm"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Course
        </Button>
      </div>

      <div className="space-y-4">
        {modules.map((module) => {
          const moduleContents = contentsByModule[module._id] || [];
          
          return (
            <div 
              key={module._id} 
              className="bg-white rounded-lg border shadow-sm overflow-hidden"
            >
              <div 
                className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => toggleModule(module._id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{module.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {moduleContents.length} {moduleContents.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <div>
                  {expandedModuleId === module._id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  )}
                </div>
              </div>
              
              {expandedModuleId === module._id && (
                <div className="p-4 border-t">
                  {module.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {module.description}
                    </p>
                  )}
                  
                  <div className="space-y-4">
                    {moduleContents.map((content) => (
                      <div key={content._id} className="pl-2">
                        <div 
                          className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                          onClick={() => toggleContent(content._id)}
                        >
                          <div className="flex items-center flex-1">
                            <div className="ml-2 text-sm flex-1">
                              <div className="flex items-center">
                                <span className="font-medium">{content.title}</span>
                                <div className="ml-2 h-6 w-6 flex items-center justify-center">
                                  {expandedContentId === content._id ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="m18 15-6-6-6 6"/>
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="m6 9 6 6 6-6"/>
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {expandedContentId === content._id && (
                          <div className="mt-2 pl-4 border-l-2 border-slate-200 text-slate-600">
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                      <polyline points="7 10 12 15 17 10"/>
                                      <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
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
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15 3 21 3 21 9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                  </svg>
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseClassroomPage;