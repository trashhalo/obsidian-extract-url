
import { Notice, Plugin } from 'obsidian';

import { isUrl, updateUrlIfYoutube } from 'iframe_converter';
import { ConfigureIframeModal } from './configure_iframe_modal';

export default class FormatNotionPlugin extends Plugin {
	async onload() {
		console.log(this.app);
		this.addCommand({
			id: "url-to-iframe",
			name: "URL to iframe/preview",
			callback: () => this.urlToIframe(),
			hotkeys: [
				{
					modifiers: ["Alt"],
					key: "i",
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
			const modal = new ConfigureIframeModal(this.app, url, editor)
			modal.open();
			console.log(modal)
		} else {
			new Notice('Select a URL to convert to an iframe.');
		}
	}
}
