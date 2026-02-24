import { NextRequest, NextResponse } from "next/server";
import { dlpFetch } from "@/app/lib/dlpClient";

/** DELETE /api/dlp/project-perimeter-map/[id] — Suppression mapping */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const res = await dlpFetch(`/api/v1/project-perimeter-map/${id}`, { method: "DELETE" });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
