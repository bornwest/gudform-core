import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author?: string;
  published?: boolean;
  content: string;
}

export interface ChangelogEntry {
  slug: string;
  title: string;
  date: string;
  version?: string;
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content");
const BLOG_DIR = path.join(CONTENT_DIR, "blog");
const CHANGELOG_DIR = path.join(CONTENT_DIR, "changelog");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getFiles(dir: string): string[] {
  ensureDir(dir);
  return fs.readdirSync(dir).filter((file) => file.endsWith(".md"));
}

export function getBlogPosts(): BlogPost[] {
  const files = getFiles(BLOG_DIR);

  const posts = files
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const filePath = path.join(BLOG_DIR, filename);
      const fileContents = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || slug,
        description: data.description || "",
        date: data.date || new Date().toISOString(),
        author: data.author,
        published: data.published ?? true,
        content,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getBlogPost(slug: string): BlogPost | null {
  try {
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || slug,
      description: data.description || "",
      date: data.date || new Date().toISOString(),
      author: data.author,
      published: data.published ?? true,
      content,
    };
  } catch {
    return null;
  }
}

export function getChangelogEntries(): ChangelogEntry[] {
  const files = getFiles(CHANGELOG_DIR);

  const entries = files
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const filePath = path.join(CHANGELOG_DIR, filename);
      const fileContents = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || slug,
        date: data.date || new Date().toISOString(),
        version: data.version,
        content,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return entries;
}

export function getChangelogEntry(slug: string): ChangelogEntry | null {
  try {
    const filePath = path.join(CHANGELOG_DIR, `${slug}.md`);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || slug,
      date: data.date || new Date().toISOString(),
      version: data.version,
      content,
    };
  } catch {
    return null;
  }
}
