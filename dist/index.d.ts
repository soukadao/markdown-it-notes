import type MarkdownIt from "markdown-it";
export type NoteType = "note" | "tip" | "important" | "warning" | "caution";
export type MarkdownItNotesOptions = {
    aliases?: Record<string, NoteType>;
    titles?: Record<NoteType, string>;
};
declare function markdownItNotes(md: MarkdownIt, options?: MarkdownItNotesOptions): void;
export default markdownItNotes;
