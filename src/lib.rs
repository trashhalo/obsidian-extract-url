mod fetch;
mod obsidian;
use html2md::parse_html;
use js_sys::{Error, JsString, Promise};
use readability::extractor::extract;
use std::rc::Rc;
use url::Url;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::{future_to_promise, JsFuture};

#[wasm_bindgen]
pub struct ExtractCommand {
    title_only: bool,
    id: JsString,
    name: JsString,
    plugin: Rc<obsidian::Plugin>,
}

#[wasm_bindgen]
impl ExtractCommand {
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> JsString {
        self.id.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_id(&mut self, id: &str) {
        self.id = JsString::from(id)
    }

    #[wasm_bindgen(getter)]
    pub fn name(&self) -> JsString {
        self.name.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_name(&mut self, name: &str) {
        self.name = JsString::from(name)
    }

    #[wasm_bindgen(method)]
    pub fn callback(&self) -> Promise {
        let plugin = self.plugin.clone();
        let title_only = self.title_only;
        future_to_promise(async move {
            let res = extract_url(&plugin, title_only).await;
            if let Err(e) = res {
                let msg = format!("error: {}", e.error);
                obsidian::Notice::new(&msg);
                Err(JsValue::from(Error::new(&msg)))
            } else {
                Ok(JsValue::undefined())
            }
        })
    }
}

#[wasm_bindgen]
pub fn onload(plugin: obsidian::Plugin) {
    let p = Rc::new(plugin);
    let cmd = ExtractCommand {
        id: JsString::from("extract-url"),
        name: JsString::from("Extract"),
        plugin: p.clone(),
        title_only: false,
    };
    p.addCommand(JsValue::from(cmd));
    let cmd = ExtractCommand {
        id: JsString::from("extract-title-from-url"),
        name: JsString::from("Title Only"),
        plugin: p.clone(),
        title_only: true,
    };
    p.addCommand(JsValue::from(cmd))
}

struct ExtractError {
    error: String,
}

impl std::convert::From<url::ParseError> for ExtractError {
    fn from(err: url::ParseError) -> Self {
        ExtractError {
            error: format!("url did not parse {}", err),
        }
    }
}

impl std::convert::From<JsValue> for ExtractError {
    fn from(err: JsValue) -> Self {
        if let Some(err_val) = err.as_string() {
            ExtractError {
                error: format!("fetch error {}", err_val),
            }
        } else {
            ExtractError {
                error: String::from("fetch error"),
            }
        }
    }
}

impl std::convert::From<readability::error::Error> for ExtractError {
    fn from(err: readability::error::Error) -> Self {
        ExtractError {
            error: format!("url not readable {}", err),
        }
    }
}

async fn extract_url(plugin: &obsidian::Plugin, title_only: bool) -> Result<(), ExtractError> {
    if let Some(view) = plugin
        .app()
        .workspace()
        .get_active_view_of_type(&obsidian::MARKDOWN_VIEW)
    {
        let editor = view.source_mode().cm_editor();

        if let Some(text) = editor.get_selection() {
            if let Some(url_str) = text.as_string() {
                let url = Url::parse(&url_str)?;
                let resp_value = JsFuture::from(fetch::with_url(&url_str)).await?;
                let resp: fetch::Response = resp_value.dyn_into()?;
                let body_opt = JsFuture::from(resp.text()?).await?.as_string();
                if let Some(body) = body_opt {
                    let ref mut b = body.as_bytes();
                    let readable = extract(b, &url)?;

                    if title_only {
                        editor.replace_selection(&format!("[{}]({})", readable.title, url_str))
                    } else {
                        editor.replace_selection(&format!(
                            "# [{}]({})\n{}",
                            readable.title,
                            url_str,
                            parse_html(&readable.content)
                        ))
                    }
                }
            }
        } else {
            return Err(ExtractError {
                error: String::from("select a url to extract"),
            });
        }
    }
    Ok(())
}
