import { Notice, Plugin } from 'obsidian';
import { parse } from './html-readability';
import { NodeHtmlMarkdown } from 'node-html-markdown'

function isUrl(text) {
	let urlRegex = new RegExp(
		"^(http:\\/\\/www\\.|https:\\/\\/www\\.|http:\\/\\/|https:\\/\\/)?[a-z0-9]+([\\-.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?$"
	);
	return urlRegex.test(text);
}

export default class ExtractUrlPlugin extends Plugin {
	async onload() {
		console.log('Loading obsidian-extract');
		this.addCommand({
			id: "extract-url",
			name: "Extract",
			callback: () => this.extractUrl()
		});
		this.addCommand({
			id: "extract-title-from-url",
			name: "Title Only",
			callback: () => this.extractUrl(true)
		});
	}

	extractUrl(titleOnly) {
		let activeLeaf = this.app.workspace.activeLeaf;
		let editor = activeLeaf.view.sourceMode.cmEditor;
		let selectedText = editor.somethingSelected()
			? editor.getSelection()
			: false;
		if (selectedText && isUrl(selectedText)) {
			parse(selectedText, function (err, article) {
				if (err) {
					new Notice(`Error reading url ${err}`);
					return
				}
				if (titleOnly) {
					editor.replaceSelection(
						`[${article.title}](${selectedText})`
					);
				} else {
					editor.replaceSelection(
						`# [${article.title}](${selectedText})\n${NodeHtmlMarkdown.translate(article.html)}`
					);
				}
			});
		} else {
			new Notice('Select a URL to extract.');
		}
	}
}
