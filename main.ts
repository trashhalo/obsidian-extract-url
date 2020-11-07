
import { App, Modal, Notice, Plugin } from 'obsidian';

import { testSameOrigin, updateUrlIfYoutube } from 'iframe_converter';
import { notionPathsToReferences } from 'regex';
import { connect } from 'http2';

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
			console.log('same origin?', testSameOrigin(selectedText));
			const url = updateUrlIfYoutube(selectedText)
			const modal = new SampleModal(this.app, url, editor)
			modal.open();
			console.log(modal)
		} else {
			new Notice('Select an url to convert to an iframe.');
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

class SampleModal extends Modal {
	url: string
	sucess: boolean
	generatedIframe: string
	editor: any

	constructor(app: App, url: string, editor: any) {
		super(app);
		this.url = url;
		this.editor = editor;
	}

	onOpen() {
		let { contentEl } = this;

		const title = contentEl.createEl('h2');
		title.innerText = "This is how the iframe is going to look (your can choose the size)";

		const iframe = createIframeEl(contentEl, this.url);

		const widthCheckbox = createShouldUseDefaultWidthCheckbox(iframe);

		const okButton = contentEl.createEl('button');
		okButton.setText('OK');
		okButton.className = 'mod-warning';
		okButton.onclick = (e) => {
			e.preventDefault();

			const generatedIframe = iframe.outerHTML;
			this.editor.replaceSelection(generatedIframe);
			this.close();
		}

		const cancelButton = contentEl.createEl('button');
		cancelButton.setText('Cancel');
		cancelButton.onclick = (e) => {
			e.preventDefault();
			this.close();
		}

		const buttonContainer = contentEl.createEl('div');
		buttonContainer.className = 'button__container';
		buttonContainer.appendChild(okButton);
		buttonContainer.appendChild(cancelButton);

		const container = contentEl.createEl('div');
		container.className = 'iframe__container';
		container.appendChild(title);
		container.appendChild(widthCheckbox);
		container.appendChild(iframe);
		container.appendChild(buttonContainer);

		contentEl.appendChild(container);
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}

function createIframeEl(contentEl: HTMLElement, url: string): HTMLIFrameElement {
	const iframe = contentEl.createEl('iframe');
	iframe.src = url;
	iframe.className = 'resize-vertical'
	iframe.style.display = 'none'

	iframe.onload = (ev) => {
		console.log('iframe is loaded!');
		var html = null;
		try {
			// deal with older browsers
			var doc = iframe.contentDocument || iframe.contentWindow.document;
			html = doc.body.innerHTML;
		} catch (err) {
			// do nothing
		}

		if (html) {
			console.log('OK');
		} else {
			console.log('bad')
		}
		iframe.style.display = 'block'
	}
	return iframe
}


function createShouldUseDefaultWidthCheckbox(iframe: HTMLElement): HTMLDivElement {
	const name = "shouldUseDefaultWidth";
	const checkboxContainer = iframe.createEl('div');
	const checkbox = iframe.createEl('input');
	checkbox.type = 'checkbox';
	checkbox.name = name;
	checkbox.checked = true;

	const label = iframe.createEl('label');
	label.setAttribute('for', name);
	label.innerText = 'Do you want to use the note default width?'

	checkbox.onclick = (e) => {
		console.log('click!!!')

		if (checkbox.checked) {
			iframe.className = 'resize-vertical'
			iframe.style.width = '100%'
		} else {
			iframe.className = 'resize-both'
		}
	}

	checkboxContainer.appendChild(checkbox);
	checkboxContainer.appendChild(label);

	return checkboxContainer;


}