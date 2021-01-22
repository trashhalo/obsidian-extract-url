# Obsidian Plugin: Convert a URL (e.g. YouTube) into an iframe (preview)
**Transform a YouTube URL into a YouTube preview.**

![Demo](images/demo-url-to-preview-2.gif)

Transform a selected URL to an embed view if the website allows it. It offers the possibilitiy to resize the preview.

The default hotkey is `cmd + shift + i`.


# Installation
Support for 3rd party plugins is enabled in settings (Obsidian > Settings > Third Party plugin > Safe mode - OFF)
To install this plugin, download zip archive from GitHub releases page. Extract the archive into <vault>/.obsidian/plugins.

# Future improvement
- Find a way to detect when the website doesn't allow cross origins.
- Support more websites.

# Change log

## 0.2.0
- Update: the keybinding from `Mode + Shift + I` to `Alt + I` ([Issue 4](https://github.com/FHachez/obsidian-convert-url-to-iframe/issues/4)) 
- Only ouput the app name in the console ([Issue 3](https://github.com/FHachez/obsidian-convert-url-to-iframe/issues/3))
- Add a min-height (defaults to 16:9 aspect ratio). (Kankaristo).
- Make sure the iframe can work without the CSS class. (Kankaristo)
- Fix the bad resizing when using Sliding Panes Plugin ([Issue 1](https://github.com/FHachez/obsidian-convert-url-to-iframe/issues/1)) (Kankaristo)
- Better user messages and README.md (Kankaristo)

## 0.1.0
First release

# Thank you
- [Sami Kankaristo](https://github.com/kankaristo)