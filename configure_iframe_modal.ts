import { App, Modal } from 'obsidian';


const defaultHeightValue = 'calc(var(--width) * (9/16))';

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

		const iframeContainer = createIframeContainerEl(contentEl, this.url);
		const widthCheckbox = createShouldUseDefaultWidthCheckbox(iframeContainer);
		const heightInput = createHeightInput(iframeContainer);

		const okButton = contentEl.createEl('button');
		okButton.setText('OK');
		okButton.className = 'mod-warning';
		okButton.onclick = (e) => {
			e.preventDefault();

			const generatedIframe = iframeContainer.outerHTML;
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
		container.appendChild(heightInput);
		container.appendChild(iframeContainer);
		container.appendChild(buttonContainer);
		contentEl.appendChild(container);
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}

export function createIframeContainerEl(contentEl: HTMLElement, url: string): HTMLElement {
	const iframeContainer = contentEl.createEl('div');
	iframeContainer.style.setProperty('--width', '100%');
	iframeContainer.style.position = 'relative';
	iframeContainer.style.width = '100%';
	iframeContainer.style.paddingBottom = defaultHeightValue;
	// Overflow cannot be set to "visible" (default) when using resize
	iframeContainer.style.overflow = 'auto';
	iframeContainer.style.resize = 'vertical';

	const iframe = iframeContainer.createEl('iframe');
	iframe.src = url;
	iframe.style.position = 'absolute';
	iframe.style.height = '100%';
	iframe.style.width = '100%';

	return iframeContainer;
}


export function createShouldUseDefaultWidthCheckbox(iframeContainer: HTMLElement): HTMLDivElement {
	const name = "shouldUseDefaultWidth";
	const checkboxContainer = iframeContainer.createEl('div');
	const checkbox = checkboxContainer.createEl('input');
	checkbox.type = 'checkbox';
	checkbox.name = name;
	checkbox.checked = true;

	const label = checkboxContainer.createEl('label');
	label.setAttribute('for', name);
	label.innerText = 'Do you want to fix the iframe width to the note width?';

	checkbox.onclick = (e) => {
		if (checkbox.checked) {
			iframeContainer.style.resize = 'vertical';
			iframeContainer.style.width = '100%';
		} else {
			iframeContainer.style.resize = 'both';
			iframeContainer.style.width = '';
		}
	}

	return checkboxContainer;
}


export function createHeightInput(iframeContainer: HTMLElement): HTMLDivElement {
	const heightInputName = "heightValue";
	const heightInputContainer = iframeContainer.createEl('div');
	const heightInputLabel = heightInputContainer.createEl('label');
	heightInputLabel.setAttribute('for', heightInputName);
	heightInputLabel.innerText = 'Minimum height (can be resized larger):';
	const heightInput = heightInputContainer.createEl('input');
	heightInput.type = 'text';
	heightInput.name = heightInputName;
	heightInput.value = defaultHeightValue;

	heightInput.oninput = (e) => {
		iframeContainer.style.paddingBottom = heightInput.value;
	}

	return heightInputContainer;
}
