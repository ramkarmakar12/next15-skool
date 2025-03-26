"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Send, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InviteMembersProps {
  groupId: Id<"groups">;
}

export const InviteMembers = ({ groupId }: InviteMembersProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const group = useQuery(api.groups.get, { id: groupId });
  const currentUser = useQuery(api.users.currentUser);
  const pendingInvitations = useQuery(api.users.getPendingInvitations, { groupId });
  const createInvitation = useMutation(api.users.createInvitation);

  // Check if current user is the owner or a member of the group
  const isOwner = currentUser?._id === group?.ownerId;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const result = await createInvitation({
        email,
        groupId
      });

      if (result?.success) {
        toast.success("Invitation sent successfully");
        setEmail("");
      } else if (result?.error) {
        toast.error(result.error);
      } else {
        toast.error("Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 bg-white p-6 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-slate-700" />
        <h3 className="text-lg font-medium">Invite Members</h3>
      </div>
      
      <form onSubmit={handleInvite} className="flex gap-2">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting || !isOwner}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={isSubmitting || !isOwner} 
          size="sm"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <><Send className="h-4 w-4 mr-1" /> Send</>
          )}
        </Button>
      </form>

      {!isOwner && (
        <p className="text-sm text-slate-500">
          Only the group owner can invite new members.
        </p>
      )}

      {pendingInvitations && pendingInvitations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Pending Invitations ({pendingInvitations.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {pendingInvitations.map((invitation) => (
              <div 
                key={invitation._id} 
                className="text-sm flex justify-between items-center p-2 bg-slate-50 rounded-md"
              >
                <span>{invitation.email}</span>
                <span className="text-xs text-slate-500">
                  {new Date(invitation.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
