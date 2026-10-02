// Zmniejsza zdjęcie w przeglądarce przed wysłaniem (Vercel przyjmuje max ~4,5 MB na żądanie).
export async function shrinkImage(file: File, max = 2400, quality = 0.88): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

// Podmienia pliki w <input type="file"> na zmniejszone
export async function shrinkInput(input: HTMLInputElement) {
  if (!input.files?.length) return;
  const dt = new DataTransfer();
  for (const f of Array.from(input.files)) dt.items.add(await shrinkImage(f));
  input.files = dt.files;
}
