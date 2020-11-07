import { App, Modal } from 'obsidian';

export class ConfigureIframeModal extends Modal {
	url: string;
	sucess: boolean;
	generatedIframe: string;
	editor: any;

	constructor(app: App, url: string, editor: any) {
		super(app);
		this.url = url;
		this.editor = editor;
	}

	onOpen() {
		let { contentEl } = this;

		const container = contentEl.createEl('div');
		container.className = 'iframe__container';

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
		};

		const cancelButton = contentEl.createEl('button');
		cancelButton.setText('Cancel');
		cancelButton.onclick = (e) => {
			e.preventDefault();
			this.close();
		};

		const buttonContainer = contentEl.createEl('div');
		buttonContainer.className = 'button__container';
		buttonContainer.appendChild(okButton);
		buttonContainer.appendChild(cancelButton);

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

export function createIframeEl(contentEl: HTMLElement, url: string): HTMLIFrameElement {
	const iframe = contentEl.createEl('iframe');
	iframe.src = url;
	iframe.className = 'resize-vertical'

	return iframe
}


export function createShouldUseDefaultWidthCheckbox(iframe: HTMLElement): HTMLDivElement {
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
