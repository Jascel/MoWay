// Shrinks a chosen picture to a small square JPEG (as a data URL) so it fits in the browser's storage.
export async function photoToDataUrl(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height); // crop to a centered square
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read the picture.");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}
