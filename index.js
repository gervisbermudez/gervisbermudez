const { promises: fs } = require("fs");
const path = require("path");
const quotes = require("./quotes.json");

const BLOG_START = "<!-- BLOG-POST-LIST:START -->";
const BLOG_END = "<!-- BLOG-POST-LIST:END -->";

function pickLocalQuote() {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    throw new Error("quotes.json must contain at least one quote");
  }

  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  if (!quote?.content || !quote?.character) {
    throw new Error("Each quote needs content and character");
  }

  return quote;
}

function applyTemplate(template, replacements) {
  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.split(placeholder).join(value);
  }
  return result;
}

function extractBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    return null;
  }
  return source.slice(start + startMarker.length, end);
}

function replaceBetween(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    return source;
  }
  return source.slice(0, start) + startMarker + replacement + source.slice(end);
}

async function preserveBlogPosts(readme) {
  try {
    const current = await fs.readFile(path.join(process.cwd(), "README.md"), "utf-8");
    const existing = extractBetween(current, BLOG_START, BLOG_END);
    if (existing && existing.trim()) {
      return replaceBetween(readme, BLOG_START, BLOG_END, existing);
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
  return readme;
}

async function main() {
  const templatePath = path.join(process.cwd(), "README.template.md");
  const readmeTemplate = await fs.readFile(templatePath, "utf-8");
  const quote = pickLocalQuote();

  const generated = applyTemplate(readmeTemplate, {
    "{office_quote}": quote.content,
    "{office_character}": `- ${quote.character}`,
  });
  const readme = await preserveBlogPosts(generated);

  await fs.writeFile("README.md", readme);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
