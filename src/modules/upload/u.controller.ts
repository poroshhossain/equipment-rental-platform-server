import type { Request, Response } from "express";

/** Accepts a base64 image and returns a hosted URL from ImgBB. */
export const uploadImage = async (req: Request, res: Response) => {
  const apiKey = process.env.IMGBB_API_KEY ?? "";
  const image = typeof req.body.image === "string" ? req.body.image : "";

  if (!image) {
    res.status(400).json({ success: false, message: "No image provided" });
    return;
  }

  if (!apiKey) {
    res.status(200).json({
      success: true,
      message: "ImgBB is not configured",
      data: { url: null },
    });
    return;
  }

  try {
    const body = new URLSearchParams({ key: apiKey, image });
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body,
    });
    const result = (await response.json()) as {
      data?: { url?: string };
      error?: { message?: string };
    };

    if (!response.ok || !result.data?.url) {
      res.status(400).json({
        success: false,
        message: result.error?.message ?? "Image upload failed",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: { url: result.data.url },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Image upload failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
