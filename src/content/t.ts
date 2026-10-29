import { copy, type CopyKey } from "@/content/copy.generated";

export function t(key: CopyKey, variables: Record<string, string> = {}) {
  return copy[key].replace(/\{([a-zA-Z_]+)\}/g, (placeholder, name: string) => variables[name] ?? placeholder);
}
