import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pages = await prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(pages);
  } catch (error) {
    console.error("GET /api/pages error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title } = body;

    let workspace = await prisma.workspace.findFirst();
    let user = await prisma.user.findFirst();

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "demo@collabspace.com",
          name: "Demo User",
          password: "password123",
        },
      });
    }

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "My Workspace",
          members: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });
    }

    const newPage = await prisma.page.create({
      data: {
        title: title || "Untitled",
        content: "",
        workspaceId: workspace.id,
        authorId: user.id,
      },
    });

    return NextResponse.json(newPage, { status: 201 });
  } catch (error) {
    console.error("POST /api/pages error:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}