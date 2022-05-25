# Obsidian Plugin: Convert a URL into markdown

![Demo](images/demo-extract-url.gif)

Transforms a URL to markdown view if the website allows it.

# Installation

Available in the community plugin store in options.

# Modes

Operates in 2 modes.

1. **Selection** - If you select a URL in the document and execute these commands it will replace the selection with the markdown content.
2. **Document** - If you add front mater with the key of `link` to your document then it is treated as a linked document. Then calling extract will look for the link and replace the content of the document with the extracted content.
3. **Archive** - Extract every `[foo](https://url.com)` url found in the doucment. Replace external links to internal ones. Files created in `archive` folder.

## Document mode example

```markdown
---
link: "https://bart.degoe.de/building-a-full-text-search-engine-150-lines-of-code/"
---

everything below the --- will be replaced when calling extract
```

# Commands

- **Extract**: Replace url or document with readable markdown extracted from the sites html content
- **Title Only**: Replace url or document with a markdown anchor with the title extracted from the page content
- **Import from Clipboard**: Extract content from url that is found in your clipboard and dump it at your cursor.

# Youtube

If your system has `youtube-dl` installed extra details like channel name and description will be extracted for youtube urls.

![youtube](images/youtube.png)
