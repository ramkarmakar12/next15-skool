import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export const create = mutation({
    args: { 
        name: v.string(), 
        description: v.optional(v.string()),
        isPublic: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authenticated user");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (user === null) {
            return;
            throw new Error("User not stored in database.");
        }

        // Set a far future expiration date (10 years from now)
        const farFutureDate = Date.now() + 1000 * 60 * 60 * 24 * 365 * 10; // 10 years in milliseconds

        const groupId = await ctx.db.insert("groups", {
            name: args.name,
            description: args.description,
            ownerId: user._id,
            price: 0,
            memberNumber: 1,
            isPublic: args.isPublic ?? false, // Set isPublic flag with default false
            endsOn: farFutureDate, // Add a default far-future expiration date
        });

        // Add the creator as a member of the group
        await ctx.db.insert("userGroups", {
            userId: user._id,
            groupId: groupId,
        });

        return groupId;
    }
});


export const get = query({
    args: { id: v.optional(v.id("groups")) },
    handler: async (ctx, { id }) => {
        // Check if ID is provided
        if (!id) {
            return null;
        }
        
        try {
            const group = await ctx.db.get(id);
            
            // If group is public, return it regardless of authentication
            if (group && group.isPublic === true) {
                return group;
            }
            
            // For private groups, check authentication
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                return null; // Return null instead of throwing error when not authenticated
            }
            
            // Now that we have a user, let's check if they're a member of this group
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) =>
                    q.eq("tokenIdentifier", identity.tokenIdentifier))
                .unique();
                
            if (!user) {
                return null;
            }
            
            // Return the group (may be null if it doesn't exist)
            return group;
        } catch (error) {
            // Handle any errors (like invalid ID format)
            console.error("Error retrieving group:", error);
            return null;
        }
    },
});


export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        console.log("Identity:", identity ? "Authenticated" : "Not Authenticated");

        if (!identity) {
            // Return public groups if no authentication
            const publicGroups = await ctx.db
                .query("groups")
                .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
                .collect();
            console.log("Public Groups (Unauthenticated):", publicGroups.length);
            return publicGroups;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        console.log("User found:", user ? "Yes" : "No");
        if (user === null) {
            return [];
        }

        const userGroups = await ctx.db
            .query("userGroups")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        console.log("User Groups count:", userGroups.length);

        // now get all groups that this user belongs to or are public
        const groups = await Promise.all(userGroups.map(async (userGroup) => {
            const group = await ctx.db.get(userGroup.groupId);
            return group;
        }));

        const publicGroups = await ctx.db
            .query("groups")
            .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
            .collect();

        console.log("Public Groups count:", publicGroups.length);

        const combinedGroups = [...groups, ...publicGroups];

        const filteredGroups = combinedGroups.filter(group => group !== null) as Doc<"groups">[];
        
        // Remove duplicates
        const uniqueGroups = Array.from(new Set(filteredGroups.map(g => g._id)))
            .map(id => filteredGroups.find(g => g._id === id)!);

        console.log("Total Unique Groups:", uniqueGroups.length);
        return uniqueGroups;
    }
});


export const getMembers = query({
    args: { id: v.id("groups") },
    handler: async (ctx, { id }) => {
        const members = await ctx.db
            .query("userGroups")
            .withIndex("by_groupId", (q) => q.eq("groupId", id))
            .collect();

        const resolvedMembers = await Promise.all(members.map(async (member) => {
            const user = await ctx.db.get(member.userId);
            return user;
        }));

        const filteredMembers = resolvedMembers.filter(member => member !== null) as Doc<"users">[];

        return filteredMembers;
    },
});


export const listAll = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const groups = await ctx.db.query("groups").collect();

        return groups;
    }
});

// List public groups that are available to all users, even without authentication
export const listPublicGroups = query({
    args: {},
    handler: async (ctx) => {
        // Get all groups marked as public
        const publicGroups = await ctx.db
            .query("groups")
            .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
            .collect();

        return publicGroups;
    }
});

// Join a public group (requires authentication)
export const joinPublicGroup = mutation({
    args: { groupId: v.id("groups") },
    handler: async (ctx, { groupId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (user === null) {
            return null;
        }

        // Verify that the group exists and is public
        const group = await ctx.db.get(groupId);
        if (!group || group.isPublic !== true) {
            return null;
        }

        // Check if the user is already a member
        const existingMembership = await ctx.db
            .query("userGroups")
            .withIndex("by_userId", (q) => 
                q.eq("userId", user._id))
            .filter(q => q.eq(q.field("groupId"), groupId))
            .unique();

        if (existingMembership) {
            return { success: true, alreadyMember: true };
        }

        // Add the user to the group
        await ctx.db.insert("userGroups", {
            userId: user._id,
            groupId: groupId,
        });

        // Increment the member count
        await ctx.db.patch(groupId, {
            memberNumber: group.memberNumber + 1,
        });

        return { success: true, alreadyMember: false };
    }
});

// Update group's public status
export const updatePublicStatus = mutation({
    args: { id: v.id("groups"), isPublic: v.boolean() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        // Get the group
        const group = await ctx.db.get(args.id);
        if (!group) {
            throw new Error("Group not found");
        }

        // Only group owner can change the public status
        if (group.ownerId !== user._id) {
            throw new Error("Only the group owner can update the public status");
        }

        // Update the public status
        await ctx.db.patch(args.id, {
            isPublic: args.isPublic,
        });

        return { success: true };
    },
});

export const updateName = mutation({
    args: { id: v.id("groups"), name: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthorized");
        }

        const name = args.name.trim();

        if (!name) {
            throw new Error("name is required");
        }

        if (name.length > 60) {
            throw new Error("name cannot be longer than 60 characters")
        }

        const group = await ctx.db.patch(args.id, {
            name: args.name,
        });

        return group;
    },
});

export const updateDescription = mutation({
    args: { id: v.id("groups"), description: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthorized");
        }

        const description = args.description.trim();

        if (!description) {
            throw new Error("Description is required");
        }

        if (description.length > 40000) {
            throw new Error("Description is too long.")
        }

        const group = await ctx.db.patch(args.id, {
            description: args.description,
        });

        return group;
    },
});


//update subscription
export const updateSubscription = internalMutation({
    args: { subscriptionId: v.string(), groupId: v.id("groups"), endsOn: v.number() },
    handler: async (ctx, { subscriptionId, groupId, endsOn }) => {
        await ctx.db.patch(groupId, {
            subscriptionId: subscriptionId,
            endsOn: endsOn
        });
    },
});

//update subscription by id
export const updateSubscriptionById = internalMutation({
    args: { subscriptionId: v.string(), endsOn: v.number() },
    handler: async (ctx, { subscriptionId, endsOn }) => {
        const user = await ctx.db.query("groups")
            .withIndex("by_subscriptionId", (q) => q.eq("subscriptionId", subscriptionId))
            .unique();

        if (!user) {
            throw new Error("User not found!");
        }

        await ctx.db.patch(user._id, {
            endsOn: endsOn
        });
    },
});