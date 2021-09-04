use js_sys::Promise;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(catch)]
    pub fn request(params: JsValue) -> Result<Promise, JsValue>;
}

pub fn request_params(url: &str) -> JsValue {
    let obj = js_sys::Object::new();
    js_sys::Reflect::set(&obj, &"url".into(), &JsValue::from_str(url)).unwrap();
    obj.into()
}
