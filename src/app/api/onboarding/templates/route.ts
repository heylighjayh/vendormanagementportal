import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveStorageDownloadUrl } from "@/lib/file-storage";
import { getPrismaClient } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const templates = await prisma.onboardingDocumentTemplate.findMany({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      templateStoragePath: true,
      isRequired: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    templates: await Promise.all(
      templates.map(async (template) => ({
        ...template,
        downloadUrl: await resolveStorageDownloadUrl(template.templateStoragePath),
      })),
    ),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    templateStoragePath?: string;
    isRequired?: boolean;
  };

  if (!body.name || !body.templateStoragePath) {
    return NextResponse.json(
      { error: "name and templateStoragePath are required." },
      { status: 400 },
    );
  }

  const prisma = getPrismaClient();
  const template = await prisma.onboardingDocumentTemplate.create({
    data: {
      name: body.name,
      description: body.description,
      templateStoragePath: body.templateStoragePath,
      isRequired: body.isRequired ?? true,
      uploadedById: session.user.id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      templateStoragePath: true,
      isRequired: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      template: {
        ...template,
        downloadUrl: await resolveStorageDownloadUrl(template.templateStoragePath),
      },
    },
    { status: 201 },
  );
}
