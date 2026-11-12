import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { currentUser, isAdmin } from "@/lib/auth/session";
import { MAX_RAW_BYTES, RAW_TYPES } from "@/lib/media";
import { setting } from "@/lib/settings";

// Tokeny do wgrywania GIF-ów i wideo do portfolio prosto z przeglądarki do Vercel Blob (bez limitu 4,5 MB funkcji)
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  const token = await setting("blob_token");
  if (!token) return Response.json({ error: "Brak tokenu Vercel Blob (BLOB_READ_WRITE_TOKEN)." }, { status: 400 });
  try {
    const json = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        const user = await currentUser();
        if (!user || !isAdmin(user)) throw new Error("Brak uprawnień.");
        if (!pathname.startsWith("portfolio/")) throw new Error("Nieprawidłowa ścieżka.");
        return { allowedContentTypes: Object.keys(RAW_TYPES), maximumSizeInBytes: MAX_RAW_BYTES, addRandomSuffix: true };
      },
    });
    return Response.json(json);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Błąd wgrywania." }, { status: 400 });
  }
}
