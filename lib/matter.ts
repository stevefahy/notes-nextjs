import fm from "front-matter";
import yaml from "js-yaml";

/** Gray-matter–compatible API using front-matter (no eval). */
export function matter(input: string): {
  content: string;
  data: Record<string, unknown>;
} {
  const parsed = fm(input);
  return {
    content: parsed.body,
    data: parsed.attributes as Record<string, unknown>,
  };
}

function stringify(content: string, data?: Record<string, unknown>): string {
  if (!data || Object.keys(data).length === 0) return content;
  return `---\n${yaml.dump(data, { lineWidth: -1 }).trim()}\n---\n${content}`;
}

const matterWithStringify = Object.assign(matter, { stringify });

export type MatterFn = typeof matterWithStringify;

export default matterWithStringify;
