import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request: req as any,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        if (payload.password !== process.env.ADMIN_PASSWORD) {
          throw new Error("Unauthorized");
        }
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 500 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {},
    });

    return res.json(jsonResponse);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}
