use js_sys::{Function, JsString};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "obsidian")]
extern "C" {
    pub type Plugin;
    pub type Notice;
    pub type App;
    pub type Workspace;
    pub type WorkspaceLeaf;
    pub type View;
    pub type MarkdownView;
    pub type MarkdownSourceView;
    pub type CmEditor;

    #[wasm_bindgen(js_name=MarkdownView)]
    pub static MARKDOWN_VIEW: Function;

    #[wasm_bindgen(method)]
    pub fn addCommand(this: &Plugin, command: JsValue);

    #[wasm_bindgen(method, getter)]
    pub fn app(this: &Plugin) -> App;

    #[wasm_bindgen(method, getter)]
    pub fn workspace(this: &App) -> Workspace;

    #[wasm_bindgen(method, js_name = "getActiveViewOfType")]
    pub fn get_active_view_of_type(this: &Workspace, t: &Function) -> Option<View>;

    #[wasm_bindgen(method, getter, js_name = "sourceMode")]
    pub fn source_mode(this: &View) -> MarkdownSourceView;

    #[wasm_bindgen(method, getter, js_name = "cmEditor")]
    pub fn cm_editor(this: &MarkdownSourceView) -> CmEditor;

    #[wasm_bindgen(method, js_name = "getSelection")]
    pub fn get_selection(this: &CmEditor) -> Option<JsString>;

    #[wasm_bindgen(method, js_name = "replaceSelection")]
    pub fn replace_selection(this: &CmEditor, text: &str);

    #[wasm_bindgen(constructor)]
    pub fn new(message: &str) -> Notice;
}
