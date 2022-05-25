use js_sys::Function;
use js_sys::Promise;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "obsidian")]
extern "C" {
    pub type Plugin;
    pub type Notice;
    pub type App;
    pub type Workspace;
    pub type WorkspaceLeaf;
    pub type Vault;
    pub type DataAdapter;
    pub type View;
    pub type MarkdownView;
    pub type MarkdownSourceView;
    pub type CmEditor;
    pub type TFile;
    pub type TAbstractFile;
    pub type FileManager;
    pub type RustSettingsTab;
    pub type Element;
    pub type Setting;
    pub type TextComponent;

    #[wasm_bindgen(js_name=MarkdownView)]
    pub static MARKDOWN_VIEW: Function;

    #[wasm_bindgen(js_namespace=Platform, js_name=isDesktop)]
    pub static DESKTOP: bool;

    #[wasm_bindgen(method)]
    pub fn addCommand(this: &Plugin, command: JsValue);

    #[wasm_bindgen(method, getter)]
    pub fn app(this: &Plugin) -> App;

    #[wasm_bindgen(method, getter)]
    pub fn vault(this: &App) -> Vault;

    #[wasm_bindgen(method, getter)]
    pub fn workspace(this: &App) -> Workspace;

    #[wasm_bindgen(method, getter, js_name=fileManager)]
    pub fn file_manager(this: &App) -> FileManager;

    #[wasm_bindgen(method, js_name=getActiveFile)]
    pub fn get_active_file(this: &Workspace) -> Option<TFile>;

    #[wasm_bindgen(method, js_name=getActiveViewOfType)]
    pub fn get_active_view_of_type(this: &Workspace, t: &Function) -> Option<View>;

    #[wasm_bindgen(method, getter, js_name=sourceMode)]
    pub fn source_mode(this: &MarkdownView) -> MarkdownSourceView;

    #[wasm_bindgen(method, js_name=getViewData)]
    pub fn get_view_data(this: &MarkdownView) -> String;

    #[wasm_bindgen(method, getter, js_name=cmEditor)]
    pub fn cm_editor(this: &MarkdownSourceView) -> CmEditor;

    #[wasm_bindgen(method, js_name=getSelection)]
    pub fn get_selection(this: &CmEditor) -> String;

    #[wasm_bindgen(method, js_name=replaceSelection)]
    pub fn replace_selection(this: &CmEditor, text: &str);

    #[wasm_bindgen(method, js_name=setValue)]
    pub fn set_value(this: &CmEditor, value: &str);

    #[wasm_bindgen(constructor)]
    pub fn new(message: &str) -> Notice;

    #[wasm_bindgen(method)]
    pub fn read(this: &Vault, file: &TFile) -> Promise;

    #[wasm_bindgen(method)]
    pub fn modify(this: &Vault, file: &TFile, data: &str) -> Promise;

    #[wasm_bindgen(method, getter)]
    pub fn adapter(this: &Vault) -> DataAdapter;

    #[wasm_bindgen(method, catch)]
    pub fn exists(this: &DataAdapter, path: &str) -> Result<Promise, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub fn mkdir(this: &DataAdapter, path: &str) -> Result<Promise, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub fn create(this: &Vault, path: &str, data: &str) -> Result<Promise, JsValue>;

    #[wasm_bindgen(method, catch, js_name=getAbstractFileByPath)]
    pub fn get_abstract_file_by_path(
        this: &Vault,
        path: &str,
    ) -> Result<Option<TAbstractFile>, JsValue>;

    #[wasm_bindgen(method, js_name=generateMarkdownLink)]
    pub fn generate_markdown_link(
        this: &FileManager,
        file: &TFile,
        source_path: &str,
        subpath: Option<&str>,
        alias: Option<&str>,
    ) -> String;

    #[wasm_bindgen(method, getter)]
    pub fn app(this: &RustSettingsTab) -> App;

    #[wasm_bindgen(method, getter)]
    pub fn plugin(this: &RustSettingsTab) -> Plugin;

    #[wasm_bindgen(method, getter, js_name=containerEl)]
    pub fn container_el(this: &RustSettingsTab) -> Element;

    #[wasm_bindgen(method)]
    pub fn empty(this: &Element);

    #[wasm_bindgen(method, js_name=createEl)]
    pub fn create_el(this: &Element, tag: &str, options: JsValue) -> Element;

    #[wasm_bindgen(constructor)]
    pub fn new(container: &Element) -> Setting;

    #[wasm_bindgen(method, js_name=setName)]
    pub fn set_name(this: &Setting, name: &str) -> Setting;

    #[wasm_bindgen(method, js_name=setDesc)]
    pub fn set_desc(this: &Setting, desc: &str) -> Setting;

    #[wasm_bindgen(method, js_name=addText)]
    pub fn add_text(this: &Setting, cb: &dyn Fn(TextComponent)) -> Setting;

    #[wasm_bindgen(method, js_name=setPlaceholder)]
    pub fn set_placeholder(this: &TextComponent, placeholder: &str) -> TextComponent;

    #[wasm_bindgen(method, js_name=setValue)]
    pub fn set_value(this: &TextComponent, value: &str) -> TextComponent;

    #[wasm_bindgen(method, js_name=onChange)]
    pub fn on_change(this: &TextComponent, cb: JsValue) -> TextComponent;
}

#[wasm_bindgen(
    inline_js = "export function plugin() { return app.plugins.plugins['extract-url']; }"
)]
extern "C" {
    pub fn plugin() -> Plugin;
}
