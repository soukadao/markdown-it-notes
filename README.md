# @soukadao/markdown-it-notes

GitHub Alerts と Qiita 風 `:::note` 記法を、VS Code の標準 Markdown プレビューでも使える markdown-it プラグインです。

```js
const MarkdownIt = require("markdown-it");
const notes = require("@soukadao/markdown-it-notes");

const md = new MarkdownIt({ html: true }).use(notes);
```
