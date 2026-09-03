import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put, list, del } from "@vercel/blob";

function unauthorized(res: VercelResponse) {
  return res.status(401).json({ error: "Unauthorized" });
}

function checkAuth(req: VercelRequest): boolean {
  const password = req.headers["x-admin-password"] as string | undefined;
  return password === process.env.ADMIN_PASSWORD;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const { blobs } = await list({ prefix: "papers/meta/" });
      const papers = await Promise.all(
        blobs.map(async (blob) => {
          const resp = await fetch(blob.url);
          return resp.json();
        })
      );
      papers.sort((a: any, b: any) => b.year - a.year);
      return res.json(papers);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to list papers: " + err.message });
    }
  }

  if (req.method === "POST") {
    if (!checkAuth(req)) return unauthorized(res);

    const metadata = req.body;
    if (!metadata || !metadata.title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const id = metadata.id || `paper-${Date.now()}`;
    metadata.id = id;

    try {
      await put(`papers/meta/${id}.json`, JSON.stringify(metadata), {
        access: "public",
        contentType: "application/json",
      });
      return res.status(201).json(metadata);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to save metadata: " + err.message });
    }
  }

  if (req.method === "DELETE") {
    if (!checkAuth(req)) return unauthorized(res);

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing id" });
    }

    try {
      const { blobs: metaBlobs } = await list({ prefix: `papers/meta/${id}.json` });
      const { blobs: pdfBlobs } = await list({ prefix: `papers/pdf/${id}.pdf` });

      const urls = [...metaBlobs, ...pdfBlobs].map((b) => b.url);
      if (urls.length > 0) {
        await del(urls);
      }

      return res.json({ deleted: id });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to delete: " + err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
