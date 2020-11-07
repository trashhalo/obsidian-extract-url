import { updateUrlIfYoutube } from 'iframe_converter';
import { Plugin } from 'obsidian';
import { notionPathsToReferences } from 'regex';

function isUrl(text: string): boolean {
	let urlRegex = new RegExp(
		"^(http:\\/\\/www\\.|https:\\/\\/www\\.|http:\\/\\/|https:\\/\\/)?[a-z0-9]+([\\-.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?$"
	);
	return urlRegex.test(text);
}

export default class FormatNotionPlugin extends Plugin {
	async onload() {
		console.log(this.app);
		this.addCommand({
			id: "url-to-iframe",
			name: "Url to iframe",
			callback: () => this.urlToIframe(),
			hotkeys: [
				{
					modifiers: ["Mod", "Shift"],
					key: "i",
				},
			],
		});
		this.addCommand({
			id: "notion-paths-to-references",
			name: "Notion Paths Separated by space to References",
			callback: () => this.notionPathsToReferences(),
			hotkeys: [
				{
					modifiers: ["Mod", "Shift"],
					key: "p",
				},
			],
		});
	}

	urlToIframe(): void {
		let activeLeaf: any = this.app.workspace.activeLeaf;
		let editor = activeLeaf.view.sourceMode.cmEditor;
		let selectedText = editor.somethingSelected()
			? editor.getSelection()
			: false;

		if (selectedText && isUrl(selectedText)) {
			const url = updateUrlIfYoutube(selectedText)
			editor.replaceSelection(`<iframe src="${url}" width="100%" height="500px">`);
		}
	}

	notionPathsToReferences(): void {
		let activeLeaf: any = this.app.workspace.activeLeaf;
		let editor = activeLeaf.view.sourceMode.cmEditor;
		let selectedText = editor.somethingSelected()
			? editor.getSelection()
			: false;

		if (selectedText) {
			const updatedSelection = notionPathsToReferences(selectedText);
			editor.replaceSelection(updatedSelection);
		}
	}
}