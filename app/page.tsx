"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/group-card";
import { Spinner } from "@/components/spinner";
import { Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { Navbar } from "@/components/navbar";

// Define base category types
const baseCategories = [
  { id: "all", name: "All", icon: "🌐" },
  { id: "hobbies", name: "Hobbies", icon: "🎨" },
  { id: "music", name: "Music", icon: "🎵" },
  { id: "money", name: "Money", icon: "💰" },
  { id: "spirituality", name: "Spirituality", icon: "🧘" },
  { id: "tech", name: "Tech", icon: "💻" },
  { id: "health", name: "Health", icon: "🏥" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "self-improvement", name: "Self-improvement", icon: "📈" },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState(baseCategories);
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  // Get all public groups
  const groups = useQuery(api.groups.getPublicGroups) || [];
  
  // Extract unique categories from groups and add them to the categories list
  useEffect(() => {
    if (groups && groups.length > 0) {
      const uniqueCategories = new Set(baseCategories.map(c => c.name.toLowerCase()));
      const customCategories = [];
      
      groups.forEach(group => {
        if (group.category && !uniqueCategories.has(group.category.toLowerCase())) {
          uniqueCategories.add(group.category.toLowerCase());
          customCategories.push({
            id: group.category.toLowerCase(),
            name: group.category,
            icon: "🏷️" // Default icon for custom categories
          });
        }
      });
      
      if (customCategories.length > 0) {
        setCategories([...baseCategories, ...customCategories]);
      }
    }
  }, [groups]);
  
  // Filter groups based on search query and selected category
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || 
                           (group.category && group.category.toLowerCase() === selectedCategory);
    
    return matchesSearch && (selectedCategory === "all" || matchesCategory);
  });

  // Determine which categories to display
  const displayCategories = showAllCategories ? categories : categories.slice(0, 9);

  return (
    <div className="h-full flex flex-col">
      {/* Include the navbar */}
      <Navbar />
      
      <div className="flex flex-col items-center justify-center p-6 md:p-10">
        <div className="max-w-5xl w-full">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <Logo />
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Discover communities
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground">
              or <Link href="/create" className="text-primary hover:underline">create your own</Link>
            </p>
            
            {/* Search bar */}
            <div className="w-full max-w-md relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for anything"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Category filters */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {displayCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="rounded-full"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
              {categories.length > 9 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                >
                  {showAllCategories ? "Show Less" : "More..."}
                </Button>
              )}
            </div>
          </div>
          
          {/* Group listings */}
          <div className="mt-10">
            {!groups ? (
              <div className="h-40 flex items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">
                  {selectedCategory === "all" 
                    ? "Popular communities" 
                    : `${categories.find(c => c.id === selectedCategory)?.name} communities`}
                </h2>
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No communities found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredGroups.map((group) => (
                      <GroupCard
                        key={group._id}
                        id={group._id}
                        name={group.name}
                        description={group.description || ""}
                        members={group.memberNumber || 0}
                        category={group.category || "General"}
                        rank={group.rank}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}