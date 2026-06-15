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
    const { blobs } = await list({ prefix: "blogs/meta/" });
    const posts = await Promise.all(
      blobs.map(async (blob) => {
        const resp = await fetch(blob.url);
        return resp.json();
      })
    );
    posts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return res.json(posts);
  }

  if (req.method === "POST") {
    if (!checkAuth(req)) return unauthorized(res);

    const body = req.body;
    if (!body || !body.title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const id = body.id || Date.now();
    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ||
      `post-${id}`;

    const post = {
      id,
      slug,
      title: body.title,
      date: body.date || new Date().toISOString().split("T")[0],
      excerpt: body.excerpt || body.content?.replace(/<[^>]*>/g, "").slice(0, 200) || "",
      content: body.content || "",
      sourceUrl: body.sourceUrl || "",
    };

    await put(`blogs/meta/${slug}.json`, JSON.stringify(post), {
      access: "public",
      contentType: "application/json",
    });

    return res.status(201).json(post);
  }

  if (req.method === "DELETE") {
    if (!checkAuth(req)) return unauthorized(res);

    const { slug } = req.query;
    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ error: "Missing slug" });
    }

    const { blobs } = await list({ prefix: `blogs/meta/${slug}.json` });
    const urls = blobs.map((b) => b.url);
    if (urls.length > 0) {
      await del(urls);
    }

    return res.json({ deleted: slug });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
