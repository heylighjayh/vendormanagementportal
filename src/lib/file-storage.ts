import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const DEFAULT_BUCKET = "portal-files";
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function getSupabaseProjectUrl() {
  const explicitUrl =
    process.env["SUPABASE_URL"] ?? process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";

  if (explicitUrl) {
    return explicitUrl;
  }

  const connectionString = process.env["DATABASE_URL"] ?? "";

  if (!connectionString) {
    return "";
  }

  try {
    const parsed = new URL(connectionString);
    const usernameParts = parsed.username.split(".");

    if (usernameParts.length >= 2 && usernameParts[0] === "postgres") {
      return `https://${usernameParts[1]}.supabase.co`;
    }

    const hostMatch = parsed.hostname.match(/^db\.([^.]+)\.supabase\.co$/i);

    if (hostMatch?.[1]) {
      return `https://${hostMatch[1]}.supabase.co`;
    }
  } catch {
    return "";
  }

  return "";
}

function getStorageBucketName() {
  return process.env["STORAGE_BUCKET"]?.trim() || DEFAULT_BUCKET;
}

function getSupabaseServiceRoleKey() {
  return process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim() || "";
}

export function getStorageBackendLabel() {
  return isSupabaseStorageConfigured() ? "Supabase Storage" : "Local development uploads";
}

export function isSupabaseStorageConfigured() {
  return Boolean(getSupabaseProjectUrl() && getSupabaseServiceRoleKey());
}

function createSupabaseStorageClient() {
  const url = getSupabaseProjectUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase Storage is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let ensuredBucketName: string | null = null;

async function ensureSupabaseBucket() {
  const bucketName = getStorageBucketName();

  if (ensuredBucketName === bucketName) {
    return bucketName;
  }

  const supabase = createSupabaseStorageClient();
  const { data: bucket } = await supabase.storage.getBucket(bucketName);

  if (!bucket) {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: `${MAX_UPLOAD_BYTES}`,
    });

    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Unable to create storage bucket: ${error.message}`);
    }
  }

  ensuredBucketName = bucketName;
  return bucketName;
}

function sanitizePathPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function splitFileName(fileName: string) {
  const parsed = path.parse(fileName);
  const baseName = sanitizePathPart(parsed.name) || "file";
  const extension = sanitizePathPart(parsed.ext.replace(".", ""));

  return {
    baseName,
    extension: extension ? `.${extension}` : "",
  };
}

function buildStoragePath(area: string, entityKey: string, fileName: string) {
  const { baseName, extension } = splitFileName(fileName);
  const safeArea = sanitizePathPart(area) || "misc";
  const safeEntity = sanitizePathPart(entityKey) || "item";

  return `${safeArea}/${safeEntity}/${Date.now()}-${crypto.randomUUID()}-${baseName}${extension}`;
}

async function uploadToLocalStorage(storagePath: string, file: File) {
  const normalizedRelativePath = storagePath.replace(/\\/g, "/");
  const absolutePath = path.join(LOCAL_UPLOAD_ROOT, normalizedRelativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return `/uploads/${normalizedRelativePath}`;
}

async function uploadToSupabaseStorage(storagePath: string, file: File) {
  const bucketName = await ensureSupabaseBucket();
  const supabase = createSupabaseStorageClient();
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return storagePath;
}

export async function uploadPortalFile({
  area,
  entityKey,
  file,
}: {
  area: string;
  entityKey: string;
  file: File;
}) {
  if (file.size === 0) {
    throw new Error("Please choose a file before submitting.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Keep uploads under 20 MB for now.");
  }

  const storagePath = buildStoragePath(area, entityKey, file.name);

  return isSupabaseStorageConfigured()
    ? uploadToSupabaseStorage(storagePath, file)
    : uploadToLocalStorage(storagePath, file);
}

export async function resolveStorageDownloadUrl(storagePath: string) {
  if (!storagePath) {
    return null;
  }

  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }

  if (storagePath.startsWith("/")) {
    return storagePath;
  }

  if (!isSupabaseStorageConfigured()) {
    return null;
  }

  const bucketName = getStorageBucketName();
  const supabase = createSupabaseStorageClient();
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(storagePath, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
}
