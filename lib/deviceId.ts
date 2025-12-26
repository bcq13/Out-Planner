import { v4 as uuidv4 } from "uuid";

const KEY = "outplanner_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";

  const existing = localStorage.getItem(KEY);
  if (existing) return existing;

  const id = uuidv4();
  localStorage.setItem(KEY, id);
  return id;
}


