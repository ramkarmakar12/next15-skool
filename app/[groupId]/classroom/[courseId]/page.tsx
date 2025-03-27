"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Edit, Calendar, Trophy, BarChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCalendar } from "./_components/course-calendar";
import { CourseLeaderboard } from "./_components/course-leaderboard";
import { CourseProgress } from "./_components/course-progress";

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
  const [activeTab, setActiveTab] = useState("content");

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

  // Organize contents by moduleId for easier access
  const contentsByModule = {};
  allContents.forEach(content => {
    if (!contentsByModule[content.moduleId]) {
      contentsByModule[content.moduleId] = [];
    }
    contentsByModule[content.moduleId].push(content);
  });

  const renderCourseContent = () => {
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

    return (
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
                            {/* Content rendering based on type */}
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
                            {/* Other content types rendering */}
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
    );
  };

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="content">
            Course Content
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="progress">
            <BarChart className="h-4 w-4 mr-2" />
            Progress
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          {renderCourseContent()}
        </TabsContent>
        
        <TabsContent value="calendar">
          <CourseCalendar 
            courseId={courseId} 
            groupId={groupId}
            modules={modules}
            contents={allContents}
          />
        </TabsContent>
        
        <TabsContent value="leaderboard">
          <CourseLeaderboard 
            courseId={courseId} 
            groupId={groupId}
          />
        </TabsContent>
        
        <TabsContent value="progress">
          <CourseProgress 
            courseId={courseId} 
            groupId={groupId}
            modules={modules}
            contents={allContents}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseClassroomPage;