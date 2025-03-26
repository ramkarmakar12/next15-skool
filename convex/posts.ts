import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: { groupId: v.id("groups") },
    handler: async (ctx, { groupId }) => {
        const posts = await ctx.db
            .query("posts")
            .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
            .collect();

        const postsWithAuthors = await Promise.all(
            posts.map(async (post) => {
                const author = await ctx.db.get(post.authorId);
                if (!author) {
                    throw new Error("Author not found");
                }
                return {
                    ...post,
                    author,
                };
            })
        );

        const postsWithAuthorsAndComments = await Promise.all(
            postsWithAuthors.map(async (post) => {
                const comments = await ctx.db
                    .query("comments")
                    .withIndex("by_postId", (q) => q.eq("postId", post._id))
                    .collect();

                const commentsWithAuthors = await Promise.all(
                    comments.map(async (comment) => {
                        const author = await ctx.db.get(comment.authorId);
                        if (!author) {
                            throw new Error("Author not found");
                        }
                        return {
                            ...comment,
                            author,
                        };
                    })
                );

                return {
                    ...post,
                    comments: commentsWithAuthors,
                };
            })
        );

        const postsWithAllData = await Promise.all(
            postsWithAuthorsAndComments.map(async (post) => {
                const likes = await ctx.db
                    .query("likes")
                    .withIndex("by_postId", (q) => q.eq("postId", post._id))
                    .collect();

                // Fetch poll data if this post has an associated poll
                let pollData = null;
                if (post.pollId !== null && post.pollId !== undefined) {
                    const poll = await ctx.db.get(post.pollId);
                    if (poll) {
                        // Get poll options
                        const options = await ctx.db
                            .query("pollOptions")
                            .withIndex("by_pollId", (q) => q.eq("pollId", post.pollId!))
                            .collect();
                        
                        // Count votes for each option
                        const optionsWithVoteCounts = await Promise.all(
                            options.map(async (option) => {
                                const votes = await ctx.db
                                    .query("pollVotes")
                                    .withIndex("by_optionId", (q) => q.eq("optionId", option._id))
                                    .collect();
                                
                                return {
                                    ...option,
                                    voteCount: votes.length
                                };
                            })
                        );
                        
                        pollData = {
                            ...poll,
                            options: optionsWithVoteCounts
                        };
                    }
                }

                return {
                    ...post,
                    likes,
                    pollData
                };
            })
        );

        return postsWithAllData;
    }
});


export const create = mutation({
    args: {
        title: v.string(),
        content: v.string(),
        groupId: v.id("groups"),
        mediaUrls: v.optional(v.array(v.string())),
        mediaTypes: v.optional(v.array(v.string())),
        pollId: v.optional(v.id("polls")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            return null;
        }

        const postId = await ctx.db.insert("posts", {
            title: args.title,
            content: args.content,
            authorId: user._id,
            groupId: args.groupId,
            mediaUrls: args.mediaUrls,
            mediaTypes: args.mediaTypes,
            pollId: args.pollId,
        });

        return postId;
    }
});



export const remove = mutation({
    args: { id: v.id("posts") },
    handler: async (ctx, { id }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        // delete all comments
        const comments = await ctx.db
            .query("comments")
            .withIndex("by_postId", (q) => q.eq("postId", id))
            .collect();

        await Promise.all(comments.map(async (comment) => {
            await ctx.db.delete(comment._id);
        }));

        // delete all likes
        const likes = await ctx.db
            .query("likes")
            .withIndex("by_postId", (q) => q.eq("postId", id))
            .collect();

        await Promise.all(likes.map(async (like) => {
            await ctx.db.delete(like._id);
        }));

        // Get the post to check if it has a poll
        const post = await ctx.db.get(id);
        if (post && post.pollId) {
            // Delete all poll votes
            const votes = await ctx.db
                .query("pollVotes")
                .withIndex("by_pollId", (q) => q.eq("pollId", post.pollId!))
                .collect();
            
            await Promise.all(votes.map(async (vote) => {
                await ctx.db.delete(vote._id);
            }));
            
            // Delete all poll options
            const options = await ctx.db
                .query("pollOptions")
                .withIndex("by_pollId", (q) => q.eq("pollId", post.pollId!))
                .collect();
            
            await Promise.all(options.map(async (option) => {
                await ctx.db.delete(option._id);
            }));
            
            // Delete the poll itself
            await ctx.db.delete(post.pollId!);
        }

        // delete the post
        await ctx.db.delete(id);
        
        return { success: true };
    },
});


export const updateContent = mutation({
    args: { 
        id: v.id("posts"), 
        content: v.string(),
        mediaUrls: v.optional(v.array(v.string())),
        mediaTypes: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return null;
        }

        const content = args.content.trim();

        if (!content) {
            throw new Error("Content is required");
        }

        if (content.length > 40000) {
            throw new Error("Content is too long!");
        }

        const updateData: Partial<{ content: string; mediaUrls: string[]; mediaTypes: string[] }> = {
            content: args.content,
        };

        // Only update media fields if provided
        if (args.mediaUrls !== undefined) {
            updateData.mediaUrls = args.mediaUrls;
        }

        if (args.mediaTypes !== undefined) {
            updateData.mediaTypes = args.mediaTypes;
        }

        const post = await ctx.db.patch(args.id, updateData);

        return post;
    },
});