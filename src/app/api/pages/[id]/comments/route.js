import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const comments = await prisma.comment.findMany({
      where: { pageId: id },
      include: { author: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { content } = await req.json();

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

    const comment = await prisma.comment.create({
      data: {
        content,
        pageId: id,
        authorId: user.id,
      },
      include: { author: { select: { name: true, email: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}