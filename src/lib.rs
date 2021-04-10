mod fetch;
mod obsidian;
mod transform;
use js_sys::{Error, JsString, Promise};
use std::rc::Rc;
use thiserror::Error;
use url::Url;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::{future_to_promise, JsFuture};
use yaml_rust::emitter::{EmitError, YamlEmitter};
use yaml_rust::scanner::ScanError;

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
                let msg = format!("error: {}", e);
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

#[derive(Error, Debug)]
pub enum ExtractError {
    #[error("url did not parse. {0}")]
    Parse(#[from] url::ParseError),

    #[error("url had not content")]
    NoContent,

    #[error("fetch error `{0}`")]
    Fetch(String),

    #[error("select a url to extract or add link to your frontmatter. {0}")]
    NoUrlFrontmatter(#[from] FrontmatterError),

    #[error("expected view to be MarkdownView but was not")]
    WrongView,

    #[error("error serializing front matter. {0}")]
    FrontmatterWrite(#[from] EmitError),

    #[error("error transforming content. {0}")]
    Transform(#[from] transform::TransformError),
}

impl std::convert::From<JsValue> for ExtractError {
    fn from(err: JsValue) -> Self {
        if let Some(err_val) = err.as_string() {
            ExtractError::Fetch(format!("fetch error {}", err_val))
        } else {
            ExtractError::Fetch(String::from("fetch error"))
        }
    }
}

impl std::convert::From<obsidian::View> for ExtractError {
    fn from(_from: obsidian::View) -> Self {
        ExtractError::WrongView
    }
}

async fn extract_url(plugin: &obsidian::Plugin, title_only: bool) -> Result<(), ExtractError> {
    if let Some(md_view) = plugin
        .app()
        .workspace()
        .get_active_view_of_type(&obsidian::MARKDOWN_VIEW)
    {
        let view: obsidian::MarkdownView = md_view.dyn_into()?;
        let editor = view.source_mode().cm_editor();
        let url_str = editor.get_selection();
        if url_str == "" {
            let (url_str, content) = extract_link_from_yaml(&view.get_view_data())?;
            let md = convert_url_to_markdown(title_only, url_str).await?;
            let mut buf = String::new();
            let mut emit = YamlEmitter::new(&mut buf);
            emit.dump(&content)?;
            editor.set_value(&format!("{}\n---\n{}", buf, md));
            Ok(())
        } else {
            let md = convert_url_to_markdown(title_only, url_str).await?;
            editor.replace_selection(&md);
            Ok(())
        }
    } else {
        Err(ExtractError::WrongView)
    }
}

async fn convert_url_to_markdown(
    title_only: bool,
    url_str: String,
) -> Result<String, ExtractError> {
    let ref url = Url::parse(&url_str)?;
    let resp_value = JsFuture::from(fetch::with_url(&url_str)).await?;
    let resp: fetch::Response = resp_value.dyn_into()?;
    let body = JsFuture::from(resp.text()?)
        .await?
        .as_string()
        .ok_or_else(|| ExtractError::NoContent)?;
    Ok(transform::transform_url(url, title_only, body).await?)
}

#[derive(Error, Debug)]
pub enum FrontmatterError {
    #[error("root document not a hash")]
    NotHash,

    #[error("key link not available")]
    NoLink,

    #[error("no frontmatter found in document")]
    NoYaml,

    #[error("document failed to parse")]
    NotParseable(#[from] ScanError),

    #[error("link expected to be string type")]
    LinkNotString,
}

fn extract_link_from_yaml(view: &str) -> Result<(String, frontmatter::Yaml), FrontmatterError> {
    let fm = (frontmatter::parse(view)?).ok_or_else(|| FrontmatterError::NoYaml)?;
    if let frontmatter::Yaml::Hash(hash) = &fm {
        let link_y = hash
            .get(&frontmatter::Yaml::String(String::from("link")))
            .ok_or_else(|| FrontmatterError::NoLink)?;
        if let frontmatter::Yaml::String(link) = link_y {
            Ok((link.clone(), fm))
        } else {
            Err(FrontmatterError::LinkNotString)
        }
    } else {
        Err(FrontmatterError::NotHash)
    }
}
