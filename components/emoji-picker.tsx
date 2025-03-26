import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { useCallback } from "react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTheme } from "next-themes";

interface EmojiPickerProps {
  onChange: (value: string) => void;
}

export function EmojiPicker({ onChange }: EmojiPickerProps) {
  const { resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || 'light';
  
  const handleEmojiSelect = useCallback((emoji: any) => {
    onChange(emoji.native);
  }, [onChange]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="right" 
        sideOffset={40} 
        className="w-80 p-0 border-none shadow-xl"
        align="start"
      >
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme={currentTheme === 'dark' ? 'dark' : 'light'}
          previewPosition="none"
          skinTonePosition="none"
          set="native"
        />
      </PopoverContent>
    </Popover>
  );
}
