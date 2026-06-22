import fs from "fs";
import path from "path";
 
export interface NicheConfig {
  igUsername: string;
  detectedNiche: string;
  hashtags: string[];
  profileHandles: string[];
  lastUpdated: string;
  bestHours?: string[];
}
 
type ConfigStore = Record<string, NicheConfig>;
 
const CONFIG_PATH = path.join(process.cwd(), "niche-config.json");
 
function loadStore(): ConfigStore {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}
 
function saveStore(store: ConfigStore): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(store, null, 2), "utf-8");
}
 
export function getNicheConfig(igUsername: string): NicheConfig | null {
  const store = loadStore();
  return store[igUsername] || null;
}
 
export function saveNicheConfig(config: NicheConfig): NicheConfig {
  const store = loadStore();
  store[config.igUsername] = { ...config, lastUpdated: new Date().toISOString() };
  saveStore(store);
  return store[config.igUsername];
}
 
export function addHashtag(igUsername: string, hashtag: string): NicheConfig | null {
  const store = loadStore();
  if (!store[igUsername]) return null;
  const tag = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;
  if (!store[igUsername].hashtags.includes(tag)) {
    store[igUsername].hashtags.push(tag);
    store[igUsername].lastUpdated = new Date().toISOString();
    saveStore(store);
  }
  return store[igUsername];
}
 
export function removeHashtag(igUsername: string, hashtag: string): NicheConfig | null {
  const store = loadStore();
  if (!store[igUsername]) return null;
  const tag = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;
  store[igUsername].hashtags = store[igUsername].hashtags.filter(h => h !== tag);
  store[igUsername].lastUpdated = new Date().toISOString();
  saveStore(store);
  return store[igUsername];
}
 
export function addProfile(igUsername: string, handle: string): NicheConfig | null {
  const store = loadStore();
  if (!store[igUsername]) return null;
  const h = handle.startsWith("@") ? handle.slice(1) : handle;
  if (!store[igUsername].profileHandles.includes(h)) {
    store[igUsername].profileHandles.push(h);
    store[igUsername].lastUpdated = new Date().toISOString();
    saveStore(store);
  }
  return store[igUsername];
}
 
export function removeProfile(igUsername: string, handle: string): NicheConfig | null {
  const store = loadStore();
  if (!store[igUsername]) return null;
  const h = handle.startsWith("@") ? handle.slice(1) : handle;
  store[igUsername].profileHandles = store[igUsername].profileHandles.filter(p => p !== h);
  store[igUsername].lastUpdated = new Date().toISOString();
  saveStore(store);
  return store[igUsername];
}

export function saveScheduleHours(igUsername: string, bestHours: string[]): NicheConfig | null {
  const store = loadStore();
  if (!store[igUsername]) return null;
  store[igUsername].bestHours = bestHours;
  store[igUsername].lastUpdated = new Date().toISOString();
  saveStore(store);
  return store[igUsername];
}
