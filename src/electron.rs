use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "electron")]
extern "C" {

    #[wasm_bindgen(js_namespace=clipboard, js_name = readText)]
    pub fn clipboard_read_text() -> String;
}

