/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as comments from "../comments.js";
import type * as courseContents from "../courseContents.js";
import type * as courseModules from "../courseModules.js";
import type * as courses from "../courses.js";
import type * as email from "../email.js";
import type * as files from "../files.js";
import type * as groups from "../groups.js";
import type * as lessons from "../lessons.js";
import type * as likes from "../likes.js";
import type * as media from "../media.js";
import type * as modules from "../modules.js";
import type * as polls from "../polls.js";
import type * as posts from "../posts.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  comments: typeof comments;
  courseContents: typeof courseContents;
  courseModules: typeof courseModules;
  courses: typeof courses;
  email: typeof email;
  files: typeof files;
  groups: typeof groups;
  lessons: typeof lessons;
  likes: typeof likes;
  media: typeof media;
  modules: typeof modules;
  polls: typeof polls;
  posts: typeof posts;
  stripe: typeof stripe;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
