"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { BarChart, CheckCircle, Clock, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface CourseProgressProps {
  courseId: Id<"courses">;
  groupId: Id<"groups">;
  modules: any[];
  contents: any[];
}

export const CourseProgress = ({ courseId, groupId, modules, contents }: CourseProgressProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get current user
  const currentUser = useQuery(api.users.currentUser);
  
  // Mock progress data - in a real app, you would fetch this from your database
  const completedContentIds = contents.slice(0, Math.floor(contents.length * 0.4)).map(c => c._id);
  const inProgressContentIds = contents.slice(Math.floor(contents.length * 0.4), Math.floor(contents.length * 0.6)).map(c => c._id);
  
  // Calculate overall progress
  const overallProgress = Math.floor((completedContentIds.length / contents.length) * 100) || 0;
  
  // Calculate module progress
  const moduleProgress = modules.map(module => {
    const moduleContents = contents.filter(content => content.moduleId === module._id);
    const completedModuleContents = moduleContents.filter(content => 
      completedContentIds.includes(content._id)
    );
    
    return {
      moduleId: module._id,
      title: module.title,
      progress: Math.floor((completedModuleContents.length / moduleContents.length) * 100) || 0,
      completed: completedModuleContents.length,
      total: moduleContents.length
    };
  });
  
  // Calculate content type progress
  const contentTypes = {
    video: contents.filter(c => c.type === "video"),
    document: contents.filter(c => c.type === "document"),
    text: contents.filter(c => c.type === "text"),
    link: contents.filter(c => c.type === "link"),
    diagram: contents.filter(c => c.type === "diagram"),
    transcript: contents.filter(c => c.type === "transcript"),
  };
  
  const contentTypeProgress = Object.entries(contentTypes).map(([type, items]) => {
    const completedItems = items.filter(item => completedContentIds.includes(item._id));
    
    return {
      type,
      progress: Math.floor((completedItems.length / items.length) * 100) || 0,
      completed: completedItems.length,
      total: items.length
    };
  }).filter(item => item.total > 0);
  
  // Get upcoming deadlines (mock data)
  const upcomingDeadlines = [
    {
      id: "1",
      title: "Complete Module 1",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      moduleId: modules[0]?._id,
      progress: moduleProgress[0]?.progress || 0
    },
    {
      id: "2",
      title: "Quiz 1",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      moduleId: modules[0]?._id,
      progress: 0
    }
  ];
  
  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get content status
  const getContentStatus = (contentId: Id<"courseContents">) => {
    if (completedContentIds.includes(contentId)) return "completed";
    if (inProgressContentIds.includes(contentId)) return "in-progress";
    return "not-started";
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    if (status === "completed") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
    }
    if (status === "in-progress") {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Not Started</Badge>;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            Course Progress
          </CardTitle>
          <CardDescription>
            Track your progress through the course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Overall Progress</h3>
            <div className="flex items-center mb-2">
              <Progress value={overallProgress} className="h-2 flex-1 mr-4" />
              <span className="text-sm font-medium">{overallProgress}%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {completedContentIds.length} of {contents.length} items completed
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Module Progress</h3>
                  <div className="space-y-3">
                    {moduleProgress.map(module => (
                      <div key={module.moduleId}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm truncate">{module.title}</p>
                          <span className="text-xs font-medium">{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Upcoming Deadlines</h3>
                  {upcomingDeadlines.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingDeadlines.map(deadline => (
                        <div key={deadline.id} className="flex items-start p-2 border rounded-md">
                          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-50 rounded-md mr-3">
                            <Calendar className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{deadline.title}</p>
                            <div className="flex items-center mt-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                              <p className="text-xs text-muted-foreground">Due {formatDate(deadline.date)}</p>
                            </div>
                            {deadline.progress > 0 && (
                              <div className="mt-2">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-muted-foreground">Progress</span>
                                  <span className="text-xs font-medium">{deadline.progress}%</span>
                                </div>
                                <Progress value={deadline.progress} className="h-1" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Content Type Progress</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {contentTypeProgress.map(item => (
                    <div key={item.type} className="border rounded-md p-3">
                      <p className="text-sm font-medium capitalize mb-2">{item.type}s</p>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">
                          {item.completed} of {item.total} completed
                        </span>
                        <span className="text-xs font-medium">{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="modules" className="pt-4">
              <div className="space-y-6">
                {modules.map(module => {
                  const moduleContents = contents.filter(content => content.moduleId === module._id);
                  const moduleData = moduleProgress.find(m => m.moduleId === module._id);
                  
                  return (
                    <div key={module._id} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">{module.title}</h3>
                          <span className="text-xs font-medium">{moduleData?.progress || 0}%</span>
                        </div>
                        <Progress value={moduleData?.progress || 0} className="h-1.5 mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {moduleData?.completed || 0} of {moduleData?.total || 0} items completed
                        </p>
                      </div>
                      
                      <div className="divide-y">
                        {moduleContents.map(content => {
                          const status = getContentStatus(content._id);
                          
                          return (
                            <div key={content._id} className="p-3 flex items-center">
                              <div className="flex-shrink-0 mr-3">
                                {status === "completed" ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : status === "in-progress" ? (
                                  <Clock className="h-5 w-5 text-blue-500" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-gray-200" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{content.title}</p>
                                <p className="text-xs text-muted-foreground capitalize">{content.type}</p>
                              </div>
                              <div className="ml-3">
                                {getStatusBadge(status)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="pt-4">
              <div className="space-y-4">
                {Object.entries(contentTypes).map(([type, items]) => {
                  if (items.length === 0) return null;
                  
                  const completedItems = items.filter(item => completedContentIds.includes(item._id));
                  const progress = Math.floor((completedItems.length / items.length) * 100) || 0;
                  
                  return (
                    <div key={type} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium capitalize">{type}s</h3>
                          <span className="text-xs font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {completedItems.length} of {items.length} completed
                        </p>
                      </div>
                      
                      <div className="divide-y">
                        {items.map(content => {
                          const status = getContentStatus(content._id);
                          const module = modules.find(m => m._id === content.moduleId);
                          
                          return (
                            <div key={content._id} className="p-3 flex items-center">
                              <div className="flex-shrink-0 mr-3">
                                {status === "completed" ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : status === "in-progress" ? (
                                  <Clock className="h-5 w-5 text-blue-500" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-gray-200" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{content.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {module?.title || "Unknown module"}
                                </p>
                              </div>
                              <div className="ml-3">
                                {getStatusBadge(status)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};