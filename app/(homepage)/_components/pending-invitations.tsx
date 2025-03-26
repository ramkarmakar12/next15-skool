"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Check, Loader2, Mail, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export const PendingInvitations = () => {
  const router = useRouter();
  const pendingInvitations = useQuery(api.users.checkPendingInvitations);
  const acceptInvitation = useMutation(api.users.acceptInvitation);
  const rejectInvitation = useMutation(api.users.rejectInvitation);
  
  const [loadingStates, setLoadingStates] = useState<Record<Id<"invitations">, boolean>>({});

  if (!pendingInvitations || pendingInvitations.length === 0) {
    return null;
  }

  const handleAccept = async (invitationId: Id<"invitations">) => {
    try {
      setLoadingStates((prev) => ({ ...prev, [invitationId]: true }));
      
      const result = await acceptInvitation({ invitationId });
      
      if (result?.success) {
        toast.success("You've joined the group!");
        // Navigate to the group if not already a member
        if (!result.alreadyMember) {
          const invitation = pendingInvitations.find(inv => inv._id === invitationId);
          if (invitation) {
            router.push(`/${invitation.groupId}`);
          }
        }
      } else if (result?.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [invitationId]: false }));
    }
  };

  const handleReject = async (invitationId: Id<"invitations">) => {
    try {
      setLoadingStates((prev) => ({ ...prev, [invitationId]: true }));
      
      const result = await rejectInvitation({ invitationId });
      
      if (result?.success) {
        toast.success("Invitation rejected");
      } else if (result?.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      toast.error("Failed to reject invitation");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [invitationId]: false }));
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-10 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold">Pending Invitations</h2>
      </div>
      
      <div className="space-y-3">
        {pendingInvitations.map((invitation) => (
          <div 
            key={invitation._id} 
            className="flex items-center justify-between p-3 bg-slate-50 rounded-md"
          >
            <div>
              <p className="font-medium">{invitation.groupName}</p>
              <p className="text-sm text-slate-600">
                Invited by {invitation.inviterName}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(invitation._id)}
                disabled={loadingStates[invitation._id]}
                className="bg-green-600 hover:bg-green-700"
              >
                {loadingStates[invitation._id] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Check className="h-4 w-4 mr-1" /> Accept</>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(invitation._id)}
                disabled={loadingStates[invitation._id]}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
