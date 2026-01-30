export type PixelCrop = { x: number; y: number; width: number; height: number };

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  // Prefer webp when available; fall back to jpeg
  const webp = canvas.toDataURL("image/webp", 0.85);
  if (webp.startsWith("data:image/webp")) return webp;
  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function cropToSquareDataUrl(opts: {
  imageSrc: string;
  cropPixels: PixelCrop;
  size: number; // output square size
}): Promise<string> {
  const img = await loadImage(opts.imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = opts.size;
  canvas.height = opts.size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Draw cropped region into output square
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    img,
    opts.cropPixels.x,
    opts.cropPixels.y,
    opts.cropPixels.width,
    opts.cropPixels.height,
    0,
    0,
    opts.size,
    opts.size
  );

  return canvasToDataUrl(canvas);
}

