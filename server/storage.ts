/**
 * Minimal storage adapter for local/dev usage.
 * In production, replace with S3/Cloudinary implementation.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function storagePut(key: string, body: Buffer, _mimeType: string): Promise<{ url: string }> {
  const baseDir = join(process.cwd(), "dist", "uploads");
  await mkdir(baseDir, { recursive: true });

  const safeName = key.replace(/[\\/:*?"<>|]/g, "_");
  const fullPath = join(baseDir, safeName);
  await writeFile(fullPath, body);

  return { url: `/uploads/${safeName}` };
}
