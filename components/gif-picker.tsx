import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Gift } from "lucide-react";
import Image from "next/image";

// Mock GIF service - in a real app, replace with Giphy, Tenor, or another GIF API
const MOCK_TRENDING_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTY2OTcyY2UzOGY3Y2NlZTgxOTM1OTM1OTkwMTUyZDk2NzQzNTY4YiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/KfwyWIYOeKrLlN4aSz/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2RmMDM1MTk2ZWY5ZjAxNjVlM2Q1NDE5ZDBkNDY5ZGYyMDE5YTdkYiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/C7RCCFdaixA3u/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTMzYWY1OGM0MDFmYWY2MDllNDhiMjY3NTRlMDA1Y2EwMDZkMGRkZSZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/xTiTnHvXHHxOTcdmxO/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWE3YTRiMDViMDdkOGQ2OTE3ZjI0MDYyZWFmODBiMWMxYzE0MWY5YSZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/duzpsTbcUUFETK15P5/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTRmYzMyNDU2ZjA2MmYyMDkwYTViNTdlNDU5ZGI1ZWFiNDVjOGRlNiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/l0MYJnJQ4EiYLR9de/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmFlZjhhYjk1NGI0OTQ1MTg0MGNjZDVkNmEyYmNlNDhkMmI2Y2EyMiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/26FxsQwgJyU4me9ig/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGM0ZjY1MTYwNDNlNzQ1YTc0ZTgwMTE3YmE5NGI2YTVlNDc3MmU4MSZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/8mqZxTSyfJJ8A/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTJlMDlkMzZiOTQ4ZWI3MDlkZWIzYjg0NTNlMjA1YmVkOTBhZWRhYSZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/LOcPt9gfuNOSI/giphy.gif",
];

// Mock search function
const mockSearchGifs = () => {
  // In a real app, this would call the GIF API with the query
  return MOCK_TRENDING_GIFS.slice(0, 4);
};

interface GifPickerProps {
  onSelectGif: (url: string) => void;
}

export function GifPicker({ onSelectGif }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Handle search
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      // In a real app, you'd call a GIF API here
      const results = mockSearchGifs();
      setSearchResults(results);
    }
  }, [searchQuery]);
  
  // Handle when Enter key is pressed in search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };
  
  // Handle selecting a GIF
  const handleSelectGif = (url: string) => {
    onSelectGif(url);
    setIsOpen(false);
  };
  
  useEffect(() => {
    // Load trending GIFs when component mounts
    setSearchResults(MOCK_TRENDING_GIFS);
  }, []);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Gift className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="right" 
        sideOffset={40} 
        className="w-80 p-4"
        align="start"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">GIFs</h3>
            <div className="flex space-x-2">
              <Input 
                placeholder="Search GIFs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch}
                size="sm"
              >
                Search
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Trending</h4>
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-2 gap-2">
                {searchResults.map((url, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square cursor-pointer rounded-md overflow-hidden hover:ring-2 hover:ring-primary"
                    onClick={() => handleSelectGif(url)}
                  >
                    <Image
                      src={url}
                      alt={`GIF ${index + 1}`}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <p className="text-xs text-gray-500">
            By selecting a GIF, you agree to the terms of use.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
