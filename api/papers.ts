import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put, list } from "@vercel/blob";

function unauthorized(res: VercelResponse) {
  return res.status(401).json({ error: "Unauthorized" });
}

function checkAuth(req: VercelRequest): boolean {
  const password = req.headers["x-admin-password"] as string | undefined;
  return password === process.env.ADMIN_PASSWORD;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const { blobs } = await list({ prefix: "papers/meta/" });
    const papers = await Promise.all(
      blobs.map(async (blob) => {
        const resp = await fetch(blob.url);
        return resp.json();
      })
    );
    papers.sort((a: any, b: any) => b.year - a.year);
    return res.json(papers);
  }

  if (req.method === "POST") {
    if (!checkAuth(req)) return unauthorized(res);

    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "Expected multipart/form-data" });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const body = Buffer.concat(chunks);

    const boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      return res.status(400).json({ error: "No boundary found" });
    }

    const parts = parseMultipart(body, boundary);
    const metaPart = parts.find((p) => p.name === "metadata");
    const filePart = parts.find((p) => p.name === "pdf");

    if (!metaPart) {
      return res.status(400).json({ error: "Missing metadata" });
    }

    const metadata = JSON.parse(metaPart.data.toString("utf-8"));
    const id = metadata.id || `paper-${Date.now()}`;
    metadata.id = id;

    if (filePart && filePart.filename) {
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
  }

  if (req.method === "DELETE") {
    if (!checkAuth(req)) return unauthorized(res);

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing id" });
    }

    const { del } = await import("@vercel/blob");
    const { blobs: metaBlobs } = await list({ prefix: `papers/meta/${id}.json` });
    const { blobs: pdfBlobs } = await list({ prefix: `papers/pdf/${id}.pdf` });

    const urls = [...metaBlobs, ...pdfBlobs].map((b) => b.url);
    if (urls.length > 0) {
      await del(urls);
    }

    return res.json({ deleted: id });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

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

  let start = body.indexOf(boundaryBuf) + boundaryBuf.length;

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
    if (rawData[rawData.length - 2] === 0x0d && rawData[rawData.length - 1] === 0x0a) {
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
