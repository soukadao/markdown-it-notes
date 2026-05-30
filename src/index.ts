import type MarkdownIt from "markdown-it";

export type NoteType = "note" | "tip" | "important" | "warning" | "caution";

export type MarkdownItNotesOptions = {
  aliases?: Record<string, NoteType>;
  titles?: Record<NoteType, string>;
};

const defaultAliases: Record<string, NoteType> = {
  note: "note",
  info: "note",
  tip: "tip",
  important: "important",
  warning: "warning",
  warn: "warning",
  caution: "caution",
  alert: "caution",
};

const defaultTitles: Record<NoteType, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

const githubAlertPattern = /^\s*\[!([A-Za-z]+)\][ \t]*(?:\n)?/;

type NormalizedOptions = {
  aliases: Record<string, NoteType>;
  titles: Record<NoteType, string>;
};

function normalizeOptions(options: MarkdownItNotesOptions = {}): NormalizedOptions {
  return {
    aliases: { ...defaultAliases, ...options.aliases },
    titles: { ...defaultTitles, ...options.titles },
  };
}

function addClass(target: any, ...classes: string[]): void {
  const current = target.attrGet("class");
  const values = new Set((current ?? "").split(/\s+/).filter(Boolean));
  for (const value of classes) {
    values.add(value);
  }
  target.attrSet("class", [...values].join(" "));
}

function createToken(Token: any, type: string, tag: string, nesting: -1 | 0 | 1): any {
  return new Token(type, tag, nesting);
}

function titleTokens(Token: any, label: string, level: number): any[] {
  const open = createToken(Token, "paragraph_open", "p", 1);
  open.level = level;
  open.attrSet("class", "remark-note-title");
  const inline = createToken(Token, "inline", "", 0);
  inline.level = level + 1;
  inline.content = "";
  inline.children = [createToken(Token, "text", "", 0)];
  inline.children[0].content = label;
  const close = createToken(Token, "paragraph_close", "p", -1);
  close.level = level;
  return [open, inline, close];
}

function parseBlockLines(md: MarkdownIt, state: any, startLine: number, endLine: number): void {
  const source = state.getLines(startLine, endLine, state.blkIndent, false);
  if (source.trim().length === 0) {
    return;
  }
  md.block.parse(source, md, state.env, state.tokens);
}

function qiitaNoteRule(md: MarkdownIt, options: NormalizedOptions): void {
  md.block.ruler.before("fence", "markdown_it_notes_qiita", (state, startLine, endLine, silent) => {
    const line = state.getLines(startLine, startLine + 1, 0, false).trim();
    const match = line.match(/^:::note(?:\s+([A-Za-z]+))?\s*$/);
    if (!match) {
      return false;
    }
    if (silent) {
      return true;
    }

    let nextLine = startLine + 1;
    while (nextLine < endLine && state.getLines(nextLine, nextLine + 1, 0, false).trim() !== ":::") {
      nextLine += 1;
    }

    const type = options.aliases[(match[1] ?? "note").toLowerCase()] ?? "note";
    const open = state.push("markdown_it_note_open", "div", 1);
    open.block = true;
    open.map = [startLine, nextLine + 1];
    open.attrSet("class", `remark-note remark-note-${type}`);
    open.attrSet("data-note-type", type);
    open.attrSet("data-note-source", "qiita-note");
    state.tokens.push(...titleTokens((state as any).Token, options.titles[type], state.level + 1));
    parseBlockLines(state.md, state, startLine + 1, nextLine);
    const close = state.push("markdown_it_note_close", "div", -1);
    close.block = true;
    state.line = nextLine < endLine ? nextLine + 1 : nextLine;
    return true;
  });
}

function githubAlertRule(md: MarkdownIt, options: NormalizedOptions): void {
  md.core.ruler.push("markdown_it_notes_github_alert", (state) => {
    const Token = (state as any).Token;
    for (let index = 0; index < state.tokens.length; index += 1) {
      const open = state.tokens[index];
      if (open.type !== "blockquote_open") {
        continue;
      }

      const closeIndex = state.tokens.findIndex((candidate, candidateIndex) => (
        candidateIndex > index && candidate.type === "blockquote_close" && candidate.level === open.level
      ));
      const inlineIndex = state.tokens.findIndex((candidate, candidateIndex) => (
        candidateIndex > index && (closeIndex === -1 || candidateIndex < closeIndex)
          && candidate.type === "inline"
          && githubAlertPattern.test(candidate.content)
      ));
      if (inlineIndex === -1) {
        continue;
      }

      const inline = state.tokens[inlineIndex];
      const match = inline.content.match(githubAlertPattern);
      const type = options.aliases[(match?.[1] ?? "").toLowerCase()];
      if (!type) {
        continue;
      }

      open.type = "markdown_it_note_open";
      open.tag = "div";
      addClass(open, "remark-note", `remark-note-${type}`);
      open.attrSet("data-note-type", type);
      open.attrSet("data-note-source", "github-alert");
      if (closeIndex !== -1) {
        state.tokens[closeIndex].type = "markdown_it_note_close";
        state.tokens[closeIndex].tag = "div";
      }

      inline.content = inline.content.slice(match![0].length);
      if (inline.children?.[0]?.type === "text") {
        inline.children[0].content = inline.children[0].content.slice(match![0].length);
      }
      state.tokens.splice(index + 1, 0, ...titleTokens(Token, options.titles[type], open.level + 1));
      index += 3;
    }
  });
}

function markdownItNotes(md: MarkdownIt, options: MarkdownItNotesOptions = {}): void {
  const normalized = normalizeOptions(options);
  qiitaNoteRule(md, normalized);
  githubAlertRule(md, normalized);
}

export default markdownItNotes;
module.exports = markdownItNotes;
module.exports.default = markdownItNotes;
