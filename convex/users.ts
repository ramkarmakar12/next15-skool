import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


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

        return userId;
    }
});



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
})


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
        })
    },
});