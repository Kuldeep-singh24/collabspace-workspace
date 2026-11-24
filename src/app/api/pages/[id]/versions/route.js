import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fetch all version snapshots for a page
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const snapshots = await prisma.versionSnapshot.findMany({
      where: { pageId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new version snapshot
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { content } = await req.json();

    const snapshot = await prisma.versionSnapshot.create({
      data: {
        pageId: id,
        content: content,
      },
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}