import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readBody(req: VercelRequest): Promise<Buffer> {
  if (req.body && Buffer.isBuffer(req.body)) return req.body;
  if (req.body && typeof req.body === "string") return Buffer.from(req.body, "binary");
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = req.headers["x-admin-password"] as string | undefined;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const filename = (req.headers["x-filename"] as string) || `paper-${Date.now()}.pdf`;

  try {
    const body = await readBody(req);
    if (!body.length) {
      return res.status(400).json({ error: "Empty file" });
    }

    const blob = await put(`papers/pdf/${filename}`, body, {
      access: "public",
      contentType: "application/pdf",
    });

    return res.json({ url: blob.url });
  } catch (err: any) {
    return res.status(500).json({ error: "Upload failed: " + err.message });
  }
}
