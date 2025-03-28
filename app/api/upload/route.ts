import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize the Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType, groupId } = await req.json();

    // Get a storage upload URL from Convex
    const uploadUrl = await convex.query(api.files.generateUploadUrl);

    // Return both the upload URL and the file information
    return NextResponse.json({
      uploadUrl,
      fileName,
      fileType,
      groupId
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}