"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ChevronDown, Compass, Plus } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Logo } from "../logo";

// Helper function to check if a string looks like a valid Convex ID
const isValidConvexId = (id: string | string[] | undefined): boolean => {
  // Convex IDs follow a specific pattern - this is a simple check
  // We're just making sure it's not a route name like "sign-in"
  return typeof id === 'string' && id.length > 8 && !id.includes('/');
};

export const SelectModal = () => {
  const currentUser = useQuery(api.users.currentUser, {});
  const { groupId } = useParams();
  const groups = useQuery(api.groups.list);
  const router = useRouter();
  
  // Always call useQuery, but conditionally pass undefined to "skip" the query when ID is invalid
  // This follows React hooks rules while preventing invalid ID errors
  const safeGroupId = isValidConvexId(groupId) ? (groupId as Id<"groups">) : undefined;
  // Use the skipQuery pattern - pass undefined to skip execution but keep the hook call
  const group = useQuery(api.groups.get, safeGroupId ? { id: safeGroupId } : undefined);

  const [openSelect, setOpenSelect] = useState(false);

  if (currentUser === undefined) {
    return <div>Loading...</div>;
  }

  if (currentUser === null) {
    return (
      <>
        <header className="w-full flex justify-between items-center p-4 gap-4 h-16">
          <div className="flex items-center">
            <Logo className="text-3xl" />
          </div>
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </header>
      </>
    );
  }

  if (group === undefined && isValidConvexId(groupId)) {
    return <div>Loading...</div>;
  }

  const toggleOpen = () => {
    setOpenSelect(!openSelect);
  };

  const handleCreate = () => {
    router.push("/create");
    toggleOpen();
  };

  const handleDiscover = () => {
    router.push("/");
    toggleOpen();
  };

  const handleSelect = (groupId: Id<"groups">) => {
    router.push(`/${groupId}`);
    toggleOpen();
  };

  return (
    <>
      <Popover open={openSelect}>
        <PopoverTrigger
          onClick={toggleOpen}
          className="flex space-x-2 font-semibold items-center"
        >
          {group && (
            <>
              <Avatar className="w-7 h-7">
                <AvatarImage src="https://avatars.githubusercontent.com/u/124599?v=4" />
                <AvatarFallback>{group.name[0]}</AvatarFallback>
              </Avatar>
              <p>{group.name}</p>
            </>
          )}
          {!group && <Logo className="text-4xl" />}
          <ChevronDown className="w-5 h-5" />
        </PopoverTrigger>
        <PopoverContent
          className="flex flex-col border-0 p-3 space-y-4 font-semibold"
          align="center"
        >
          <div
            className="flex gap-x-2 items-center cursor-pointer hover:bg-zinc-100 p-2 rounded-md"
            onClick={handleCreate}
          >
            <Plus className="w-7 h-7" />
            <p>Create a group</p>
          </div>
          <div
            className="flex gap-x-2 items-center cursor-pointer hover:bg-zinc-100 p-2 rounded-md"
            onClick={handleDiscover}
          >
            <Compass className="w-7 h-7" />
            <p>Discover groups</p>
          </div>
          {groups?.map((group) => (
            <div
              className="flex gap-x-2 items-center cursor-pointer hover:bg-zinc-100 p-2 rounded-md"
              key={group._id}
              onClick={() => handleSelect(group._id)}
            >
              <Avatar className="w-7 h-7">
                <AvatarImage src="https://avatars.githubusercontent.com/u/124599?v=4" />
                <AvatarFallback>{group.name[0]}</AvatarFallback>
              </Avatar>
              <div key={group._id}>{group.name}</div>
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </>
  );
};
