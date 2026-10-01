import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = req.headers["x-admin-password"] as string | undefined;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const filename = req.body?.filename;
  if (typeof filename !== "string" || !/^[\w.-]+\.pdf$/.test(filename)) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  try {
    const pathname = `papers/pdf/${filename}`;
    const token = await generateClientTokenFromReadWriteToken({
      pathname,
      allowedContentTypes: ["application/pdf"],
      maximumSizeInBytes: 500 * 1024 * 1024,
      validUntil: Date.now() + 60 * 60 * 1000,
    });
    return res.json({ token, pathname });
  } catch (err: any) {
    return res.status(500).json({ error: "Could not create upload token: " + err.message });
  }
}
