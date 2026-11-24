import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const page = await prisma.page.findUnique({
      where: { id },
      include: { comments: true, snapshots: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, content } = body;

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "kuldeep@collabspace.dev",
          name: "Kuldeep",
          password: "password123",
        },
      });
    }

    let workspace = await prisma.workspace.findFirst();
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

    const page = await prisma.page.upsert({
      where: { id },
      update: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      },
      create: {
        id,
        title: title || "Untitled Document",
        content: content || "",
        workspaceId: workspace.id,
        authorId: user.id,
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error("PUT /api/pages/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.page.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}