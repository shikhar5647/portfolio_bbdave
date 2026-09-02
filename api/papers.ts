import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put, list } from "@vercel/blob";

function unauthorized(res: VercelResponse) {
  return res.status(401).json({ error: "Unauthorized" });
}

function checkAuth(req: VercelRequest): boolean {
  const password = req.headers["x-admin-password"] as string | undefined;
  return password === process.env.ADMIN_PASSWORD;
}

async function readBody(req: VercelRequest): Promise<Buffer> {
  // Vercel may pre-parse the body — try req.body first
  if (req.body && Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (req.body && typeof req.body === "string") {
    return Buffer.from(req.body, "binary");
  }
  // Fall back to streaming
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
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

    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "Expected multipart/form-data, got: " + contentType });
    }

    let body: Buffer;
    try {
      body = await readBody(req);
    } catch (err: any) {
      return res.status(400).json({ error: "Failed to read request body: " + err.message });
    }

    if (!body.length) {
      return res.status(400).json({ error: "Empty request body" });
    }

    // Extract boundary, handling possible quotes and trailing params
    let boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      return res.status(400).json({ error: "No boundary found in content-type" });
    }
    boundary = boundary.split(";")[0].trim().replace(/^"(.*)"$/, "$1");

    let parts: MultipartPart[];
    try {
      parts = parseMultipart(body, boundary);
    } catch (err: any) {
      return res.status(400).json({ error: "Failed to parse upload: " + err.message });
    }

    const metaPart = parts.find((p) => p.name === "metadata");
    const filePart = parts.find((p) => p.name === "pdf");

    if (!metaPart) {
      return res.status(400).json({
        error: "Missing metadata field. Parts found: " + parts.map(p => p.name).join(", ") + ". Body size: " + body.length,
      });
    }

    let metadata: any;
    try {
      metadata = JSON.parse(metaPart.data.toString("utf-8"));
    } catch (err: any) {
      return res.status(400).json({ error: "Invalid metadata JSON: " + err.message });
    }

    const id = metadata.id || `paper-${Date.now()}`;
    metadata.id = id;

    try {
      if (filePart && filePart.data.length > 0) {
        const pdfBlob = await put(`papers/pdf/${id}.pdf`, filePart.data, {
          access: "public",
          contentType: "application/pdf",
        });
        metadata.pdfUrl = pdfBlob.url;
      }

      await put(`papers/meta/${id}.json`, JSON.stringify(metadata), {
        access: "public",
        contentType: "application/json",
      });

      return res.status(201).json(metadata);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to save to storage: " + err.message });
    }
  }

  if (req.method === "DELETE") {
    if (!checkAuth(req)) return unauthorized(res);

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing id" });
    }

    try {
      const { del } = await import("@vercel/blob");
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

// Vercel config: disable built-in body parsing so we can read raw multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

interface MultipartPart {
  name: string;
  filename?: string;
  contentType?: string;
  data: Buffer;
}

function parseMultipart(body: Buffer, boundary: string): MultipartPart[] {
  const parts: MultipartPart[] = [];
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const endBuf = Buffer.from(`--${boundary}--`);

  let start = body.indexOf(boundaryBuf);
  if (start === -1) {
    throw new Error(`Boundary not found in body (size: ${body.length}, boundary: ${boundary.substring(0, 30)})`);
  }
  start += boundaryBuf.length;

  while (start < body.length) {
    const nextBoundary = body.indexOf(boundaryBuf, start);
    if (nextBoundary === -1) break;

    const partData = body.subarray(start, nextBoundary);
    const headerEnd = partData.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      start = nextBoundary + boundaryBuf.length;
      continue;
    }

    const headerStr = partData.subarray(0, headerEnd).toString("utf-8");
    let rawData = partData.subarray(headerEnd + 4);
    if (rawData.length >= 2 && rawData[rawData.length - 2] === 0x0d && rawData[rawData.length - 1] === 0x0a) {
      rawData = rawData.subarray(0, rawData.length - 2);
    }

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const ctMatch = headerStr.match(/Content-Type:\s*(.+)/i);

    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch?.[1],
        contentType: ctMatch?.[1]?.trim(),
        data: rawData,
      });
    }

    start = nextBoundary + boundaryBuf.length;
    if (body.subarray(nextBoundary, nextBoundary + endBuf.length).equals(endBuf)) break;
  }

  return parts;
}
