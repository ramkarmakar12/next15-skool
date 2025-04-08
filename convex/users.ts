import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Store user information
export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        // check if user is already stored
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (user !== null) {
            return user._id;
        }

        const userId = await ctx.db.insert("users", {
            tokenIdentifier: identity.tokenIdentifier,
            name: identity.name!,
            profileUrl: identity.profileUrl,
            email: identity.email!,
        });

        // Check for any pending invitations for this email
        const pendingInvitations = await ctx.db
            .query("invitations")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .filter(q => q.eq(q.field("status"), "pending"))
            .collect();

        // Automatically add the user to the invited groups
        for (const invitation of pendingInvitations) {
            await ctx.db.insert("userGroups", {
                userId,
                groupId: invitation.groupId
            });

            // Update the invitation status
            await ctx.db.patch(invitation._id, {
                status: "accepted"
            });

            // Update the member count
            const group = await ctx.db.get(invitation.groupId);
            if (group) {
                await ctx.db.patch(invitation.groupId, {
                    memberNumber: group.memberNumber + 1
                });
            }
        }

        return userId;
    }
});

// Get the current user
export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        return await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
    }
});

// Add a user to a group
export const addToGroup = mutation({
    args: {
        email: v.string(),
        groupId: v.id("groups"),
    },
    handler: async (ctx, { email, groupId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!currentUser) {
            return null;
        }

        const group = await ctx.db.get(groupId);

        if (!group) {
            return null;
        }

        if (currentUser._id !== group.ownerId) {
            return null;
        }

        const newUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

        if (!newUser) {
            return null;
        }

        await ctx.db.insert("userGroups", {
            userId: newUser._id,
            groupId
        });

        // Update member count
        await ctx.db.patch(groupId, {
            memberNumber: group.memberNumber + 1
        });

        return { success: true };
    },
});

// Create an invitation
// Import the api at the top of your file
import { api } from "./_generated/api";

export const createInvitation = mutation({
    args: {
        email: v.string(),
        groupId: v.id("groups"),
    },
    handler: async (ctx, { email, groupId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, error: "Authentication required" };
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!currentUser) {
            return { success: false, error: "User not found" };
        }

        const group = await ctx.db.get(groupId);

        if (!group) {
            return { success: false, error: "Group not found" };
        }

        // Only the group owner or existing members can invite people
        const isMember = await ctx.db
            .query("userGroups")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .filter(q => q.eq(q.field("groupId"), groupId))
            .unique();

        if (!isMember && currentUser._id !== group.ownerId) {
            return { success: false, error: "Only group members can invite others" };
        }

        // Check if the email is already a member
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

        if (existingUser) {
            const existingMembership = await ctx.db
                .query("userGroups")
                .withIndex("by_userId", (q) => q.eq("userId", existingUser._id))
                .filter(q => q.eq(q.field("groupId"), groupId))
                .unique();

            if (existingMembership) {
                return { success: false, error: "User is already a member of this group" };
            }
        }

        // Check if there's already a pending invitation
        const existingInvitation = await ctx.db
            .query("invitations")
            .withIndex("by_email_groupId", (q) => 
                q.eq("email", email).eq("groupId", groupId))
            .filter(q => q.eq(q.field("status"), "pending"))
            .unique();

        if (existingInvitation) {
            return { success: false, error: "User already has a pending invitation" };
        }

        // Create the invitation
        const invitationId = await ctx.db.insert("invitations", {
            email,
            groupId,
            inviterId: currentUser._id,
            inviterName: currentUser.name,
            status: "pending",
            groupName: group.name,
            emailSent: false, // Initially set to false until email is sent
            createdAt: Date.now(),
        });

        try {
            // Get the application URL from environment or default to localhost
            const appUrl = process.env.NEXT_PUBLIC_HOSTING_URL || "http://localhost:3000";
            
            // Create the invitation link that the email recipient will use
            const invitationLink = `${appUrl}/${groupId}?invitation=${invitationId}`;
            
            // Log information about the invitation for debugging
            console.log("Creating invitation with link:", invitationLink);
            
            // Schedule the email sending action
            // In the createInvitation mutation, ensure proper API reference
            await ctx.scheduler.runAfter(0, api.email.sendInvitationEmail, {
                to: email,
                inviterName: currentUser.name,
                groupName: group.name,
                invitationLink // Make sure this link is properly formatted
            });
            
            // Mark the invitation as having had an email scheduled
            await ctx.db.patch(invitationId, {
                emailSent: true
            });
            
            console.log("Email scheduled for invitation:", invitationId);
        } catch (error) {
            console.error("Error scheduling invitation email:", error);
            // We still return success since the invitation was created
            // The email sending is treated as a non-critical operation
        }

        return { success: true, invitationId };
    },
});

// Internal mutation to mark an invitation as having had an email sent
export const markInvitationEmailSent = internalMutation({
    args: {
        invitationId: v.id("invitations"),
    },
    handler: async (ctx, { invitationId }) => {
        const invitation = await ctx.db.get(invitationId);
        
        if (!invitation) {
            return { success: false, error: "Invitation not found" };
        }
        
        await ctx.db.patch(invitationId, {
            emailSent: true
        });
        
        return { success: true };
    }
});

// Get all pending invitations for a specific group
export const getPendingInvitations = query({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, { groupId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!currentUser) {
            return [];
        }

        const group = await ctx.db.get(groupId);
        if (!group) {
            return [];
        }

        // Only the group owner can view all pending invitations
        if (currentUser._id !== group.ownerId) {
            return [];
        }

        // Get all pending invitations for this group
        const pendingInvitations = await ctx.db
            .query("invitations")
            .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
            .filter(q => q.eq(q.field("status"), "pending"))
            .collect();

        return pendingInvitations;
    }
});

// Check if a user has any pending invitations
export const checkPendingInvitations = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const email = identity.email;
        if (!email) {
            return [];
        }

        // Get all pending invitations for this email
        const pendingInvitations = await ctx.db
            .query("invitations")
            .withIndex("by_email", (q) => q.eq("email", email))
            .filter(q => q.eq(q.field("status"), "pending"))
            .collect();

        // Get group details for each invitation
        const invitationsWithDetails = await Promise.all(pendingInvitations.map(async (invitation) => {
            const group = await ctx.db.get(invitation.groupId);
            const inviter = await ctx.db.get(invitation.inviterId);
            
            return {
                ...invitation,
                groupName: group?.name || "Unknown group",
                inviterName: inviter?.name || "Unknown user"
            };
        }));

        return invitationsWithDetails;
    }
});

// Accept an invitation
export const acceptInvitation = mutation({
    args: {
        invitationId: v.id("invitations"),
    },
    handler: async (ctx, { invitationId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { success: false, error: "Authentication required" };
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!currentUser) {
            return { success: false, error: "User not found" };
        }

        const invitation = await ctx.db.get(invitationId);

        if (!invitation) {
            return { success: false, error: "Invitation not found" };
        }

        if (invitation.status !== "pending") {
            return { success: false, error: "Invitation has already been processed" };
        }

        // Check if the invitation is for this user
        if (invitation.email !== currentUser.email) {
            return { success: false, error: "This invitation is not for you" };
        }

        // Check if the user is already a member of the group
        const existingMembership = await ctx.db
            .query("userGroups")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .filter(q => q.eq(q.field("groupId"), invitation.groupId))
            .unique();

        if (existingMembership) {
            // Update the invitation status anyway
            await ctx.db.patch(invitationId, {
                status: "accepted",
            });
            return { success: false, error: "You are already a member of this group" };
        }

        // Check if the group exists
        const group = await ctx.db.get(invitation.groupId);
        if (!group) {
            return { success: false, error: "Group not found" };
        }

        // Add the user to the group
        await ctx.db.insert("userGroups", {
            userId: currentUser._id,
            groupId: invitation.groupId,
        });

        // Update the invitation status
        await ctx.db.patch(invitationId, {
            status: "accepted",
        });

        // Update member count
        await ctx.db.patch(invitation.groupId, {
            memberNumber: group.memberNumber + 1
        });

        return { success: true };
    },
});

// Reject an invitation
export const rejectInvitation = mutation({
    args: {
        invitationId: v.id("invitations"),
    },
    handler: async (ctx, { invitationId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const invitation = await ctx.db.get(invitationId);
        if (!invitation) {
            return { success: false, error: "Invitation not found" };
        }

        // Verify the invitation is for this user
        if (invitation.email !== identity.email) {
            return { success: false, error: "This invitation is not for you" };
        }

        // Check if invitation is still pending
        if (invitation.status !== "pending") {
            return { success: false, error: "Invitation is no longer pending" };
        }

        // Update invitation status
        await ctx.db.patch(invitationId, {
            status: "rejected"
        });

        return { success: true };
    }
});
