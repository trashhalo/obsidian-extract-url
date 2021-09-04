use js_sys::Error;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "/shim.js")]
extern "C" {
    #[wasm_bindgen(js_name=hasBin)]
    pub fn has_bin(app: &str) -> bool;

    #[wasm_bindgen(js_name=nodeExec)]
    pub fn node_exec(cmd: &str, f: &Closure<dyn FnMut(Option<Error>, String, String)>) -> JsValue;

    #[wasm_bindgen(js_name = clipboardReadText)]
    pub fn clipboard_read_text() -> String;
}
