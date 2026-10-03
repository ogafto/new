import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { currentUser, isAdmin } from "@/lib/auth/session";
import { FILE_MAX } from "@/lib/deliver";
import { setting } from "@/lib/settings";

// Tokeny do wgrywania plików zlecenia prosto z przeglądarki do Vercel Blob (dowolny typ, do 500 MB)
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  const token = await setting("blob_token");
  if (!token) return Response.json({ error: "Brak tokenu Vercel Blob — Panel → Ustawienia → Pliki." }, { status: 400 });
  try {
    const json = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async () => {
        const user = await currentUser();
        if (!user || !isAdmin(user)) throw new Error("Brak uprawnień.");
        return { maximumSizeInBytes: FILE_MAX, addRandomSuffix: true };
      },
    });
    return Response.json(json);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Błąd wgrywania." }, { status: 400 });
  }
}
