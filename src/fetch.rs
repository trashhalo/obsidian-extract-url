use js_sys::Promise;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "node-fetch")]
extern "C" {

    #[wasm_bindgen(js_name = default)]
    pub fn with_url(url: &str) -> Promise;

    pub type Response;

    #[wasm_bindgen(catch, method)]
    pub fn text(this: &Response) -> Result<Promise, JsValue>;
}
