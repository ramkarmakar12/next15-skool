"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Trophy, Medal, Star, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CourseLeaderboardProps {
  courseId: Id<"courses">;
  groupId: Id<"groups">;
}

export const CourseLeaderboard = ({ courseId, groupId }: CourseLeaderboardProps) => {
  const [activeTab, setActiveTab] = useState("points");
  const [sortBy, setSortBy] = useState("points");
  
  // Get current user
  const currentUser = useQuery(api.users.currentUser);
  
  // Get course data
  const course = useQuery(api.courses.get, { id: courseId });
  
  // Generate leaderboard data
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  
  useEffect(() => {
    if (currentUser) {
      // Create a more realistic leaderboard with the current user
      // and some generated users
      const generateUsers = () => {
        // Start with current user
        const users = [];
        
        if (currentUser) {
          users.push({
            id: currentUser._id,
            name: currentUser.name || "You",
            profileUrl: currentUser.profileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "You")}`,
            isCurrentUser: true
          });
        }
        
        // Add some generated users
        const names = ["John Doe", "Jane Smith", "Alex Johnson", "Sam Wilson", "Taylor Brown", 
                      "Chris Lee", "Jordan Patel", "Morgan Chen", "Casey Kim", "Riley Garcia"];
        
        for (let i = 0; i < 9; i++) {
          const name = names[i];
          users.push({
            id: `user${i}` as Id<"users">,
            name,
            profileUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
            isCurrentUser: false
          });
        }
        
        return users;
      };
      
      const users = generateUsers();
      
      // Generate random stats for all users
      const mockData = users.map((user) => {
        // Generate random stats for demo purposes
        const points = Math.floor(Math.random() * 1000);
        const completedItems = Math.floor(Math.random() * 30);
        const totalItems = 45;
        const completionRate = Math.floor((completedItems / totalItems) * 100);
        const streak = Math.floor(Math.random() * 14);
        
        // Give current user slightly better stats to ensure they're not at the bottom
        if (user.isCurrentUser) {
          return {
            ...user,
            points: Math.floor(Math.random() * 400) + 600, // 600-1000 points
            completedItems: Math.floor(Math.random() * 15) + 15, // 15-30 completed items
            totalItems,
            completionRate: Math.floor(((Math.random() * 15) + 15) / totalItems * 100),
            streak: Math.floor(Math.random() * 7) + 7, // 7-14 day streak
          };
        }
        
        return {
          ...user,
          points,
          completedItems,
          totalItems,
          completionRate,
          streak,
        };
      });
      
      setLeaderboardData(mockData);
    }
  }, [currentUser]);
  
  // Sort leaderboard data based on selected criteria
  const sortedLeaderboard = [...leaderboardData].sort((a, b) => {
    if (sortBy === "points") return b.points - a.points;
    if (sortBy === "completion") return b.completionRate - a.completionRate;
    if (sortBy === "streak") return b.streak - a.streak;
    return 0;
  });
  
  // Update ranks after sorting
  const rankedLeaderboard = sortedLeaderboard.map((user, index) => ({
    ...user,
    rank: index + 1
  }));
  
  // Find current user's rank
  const currentUserData = rankedLeaderboard.find(user => user.isCurrentUser);
  
  // Get medal icon based on rank
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-medium">{rank}</span>;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            Course Leaderboard
          </CardTitle>
          <CardDescription>
            See how you rank against other students in this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentUserData && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium mb-2">Your Position</h3>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  {getMedalIcon(currentUserData.rank)}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={currentUserData.profileUrl} />
                      <AvatarFallback>{currentUserData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{currentUserData.name} <span className="text-blue-600">(You)</span></p>
                      <div className="flex items-center mt-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500 mr-1" />
                        <p className="text-xs">{currentUserData.points} points</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium">Rank #{currentUserData.rank}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentUserData.completionRate}% complete
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center mb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="points">Points</TabsTrigger>
                <TabsTrigger value="completion">Completion</TabsTrigger>
                <TabsTrigger value="streak">Streak</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="completion">Completion</SelectItem>
                  <SelectItem value="streak">Streak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TabsContent value="points" className="mt-0">
            <div className="space-y-2">
              {rankedLeaderboard.map((user) => (
                <div 
                  key={user.id} 
                  className={`flex items-center p-3 rounded-md ${user.isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    {getMedalIcon(user.rank)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.profileUrl} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">
                        {user.name} {user.isCurrentUser && <span className="text-blue-600">(You)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <p className="text-sm font-medium">{user.points} points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="completion" className="mt-0">
            <div className="space-y-2">
              {rankedLeaderboard.map((user) => (
                <div 
                  key={user.id} 
                  className={`flex items-center p-3 rounded-md ${user.isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    {getMedalIcon(user.rank)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.profileUrl} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user.name} {user.isCurrentUser && <span className="text-blue-600">(You)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.completedItems} of {user.totalItems} items completed
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-auto w-24">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">{user.completionRate}%</span>
                    </div>
                    <Progress value={user.completionRate} className="h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="streak" className="mt-0">
            <div className="space-y-2">
              {rankedLeaderboard.map((user) => (
                <div 
                  key={user.id} 
                  className={`flex items-center p-3 rounded-md ${user.isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    {getMedalIcon(user.rank)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.profileUrl} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">
                        {user.name} {user.isCurrentUser && <span className="text-blue-600">(You)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-1">{user.streak}</span>
                        <span className="text-sm">day streak</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
};