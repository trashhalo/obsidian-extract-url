import { Plugin } from 'obsidian';
import { cleanURIs } from 'regex';

export default class FormatNotionPlugin extends Plugin {
	async onload() {
		console.log(this.app);
		this.addCommand({
			id: "paste-url-into-selection",
			name: "",
			callback: () => this.urlIntoSelection(),
			hotkeys: [
				{
					modifiers: ["Mod", "Shift"],
					key: "p",
				},
			],
		});
	}

	urlIntoSelection(): void {
		let activeLeaf: any = this.app.workspace.activeLeaf;
		let editor = activeLeaf.view.sourceMode.cmEditor;
		let selectedText = editor.somethingSelected()
			? editor.getSelection()
			: false;

		if (selectedText) {
			const updatedSelection = cleanURIs(selectedText);
			editor.replaceSelection(updatedSelection);
		}
	}
}