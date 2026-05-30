const assert = require("node:assert/strict");
const test = require("node:test");
const MarkdownIt = require("markdown-it");
const notes = require("../dist/index.js");

function render(source) {
  return new MarkdownIt({ html: true }).use(notes).render(source);
}

test("renders GitHub alerts", () => {
  const html = render("> [!WARNING]\n> Careful.");
  assert.match(html, /remark-note-warning/);
  assert.match(html, /data-note-source="github-alert"/);
  assert.match(html, /Careful/);
});

test("renders Qiita notes", () => {
  const html = render(":::note warn\nBody\n:::");
  assert.match(html, /remark-note-warning/);
  assert.match(html, /data-note-source="qiita-note"/);
  assert.match(html, /<p class="remark-note-title">Warning<\/p>/);
  assert.doesNotMatch(html, /:::/);
});

test("renders Qiita notes with a blank before closing fence", () => {
  const html = render(":::note warn\nBody\n\n:::");
  assert.match(html, /<p class="remark-note-title">Warning<\/p>/);
  assert.doesNotMatch(html, /:::/);
});
