import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://guxfvgiretmstpdionnr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_PFuDLFQULc3QG5eUM3G7IA_vMpCP7bn";
const R2_WORKER_URL = "https://personandb-upload.xiaobai1423.workers.dev";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadImage(file: File, prefix: string = "camp_"): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const key = prefix + Date.now() + "_" + Math.random().toString(36).slice(2, 8) + "." + ext;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("key", key);

  const res = await fetch(R2_WORKER_URL + "/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error((errData as any).error || res.statusText);
  }

  const data = await res.json() as { url: string };
  return data.url;
}

// Database mappers — convert snake_case DB columns to camelCase app types
import { Memory } from "./types";

export function mapMemory(db: any): Memory {
  return {
    id: db.id,
    title: db.title,
    date: db.date,
    year: db.year,
    category: db.category,
    tag: db.tag,
    image: db.image,
    gallery: db.gallery || [],
    pastSelf: db.past_self,
    presentSelf: db.present_self,
    pinnedBy: db.pinned_by,
    px: db.px,
    py: db.py,
    rotation: db.rotation,
    location: db.location_name ? {
      name: db.location_name,
      mx: db.location_mx,
      my: db.location_my,
    } : undefined,
  };
}

export function memoryToDb(m: Memory): Record<string, any> {
  return {
    id: m.id,
    title: m.title,
    date: m.date,
    year: m.year,
    category: m.category,
    tag: m.tag,
    image: m.image,
    gallery: m.gallery,
    past_self: m.pastSelf,
    present_self: m.presentSelf,
    pinned_by: m.pinnedBy,
    px: m.px,
    py: m.py,
    rotation: m.rotation,
    location_name: m.location?.name || null,
    location_mx: m.location?.mx || null,
    location_my: m.location?.my || null,
  };
}
