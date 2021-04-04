# Obsidian Plugin: Convert a URL into markdown
![Demo](images/demo-extract-url.gif)

Transforms a URL to markdown view if the website allows it.

# Installation
Available in the community plugin store in options.

# Commands
Operates in 2 modes.
1. __Selection__ - If you select a URL in the document and execute these commands it will replace the selection with the markdown content.
2. __Document__ - If you add front mater with the key of `link` to your document then it is treated as a linked document. Then calling extract will look for the link and replace the content of the document with the extracted content.

## Document mode example
```markdown
---
link: "https://bart.degoe.de/building-a-full-text-search-engine-150-lines-of-code/"
---

everything below the --- will be replaced when calling extract
```

# Commands
- __Extract__: Replace url or document with readable markdown extracted from the sites html content
- __Title Only__: Replace url or document with a markdown anchor with the title extracted from the page content