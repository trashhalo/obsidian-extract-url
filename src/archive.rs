use crate::extract;
use crate::extract::Markdown;
use crate::obsidian;
use crate::settings::Settings;
use fancy_regex::Captures;
use fancy_regex::Regex;
use js_sys::Promise;
use js_sys::{Error, JsString};
use lazy_static::lazy_static;
use std::collections::HashMap;
use std::collections::HashSet;
use thiserror::Error;
use url::Url;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::{future_to_promise, JsFuture};

lazy_static! {
    static ref URL_REGEX: Regex =
        Regex::new(r"(?<!#\s)\[(?P<text>.*)\]\((?P<url>http.*)\)").unwrap();
    static ref TITLE_REGEX: Regex = Regex::new(r"[^a-zA-Z0-9\-\s]").unwrap();
}

#[wasm_bindgen]
pub struct ArchiveCommand {
    id: JsString,
    name: JsString,
}

#[wasm_bindgen]
impl ArchiveCommand {
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
        future_to_promise(async move {
            let plugin = obsidian::plugin();
            let settings = crate::settings::load_settings(&plugin).await.unwrap();
            let res = archive_document(&plugin, &settings).await;
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
#[derive(Error, Debug)]
enum ArchiveError {
    #[error("expected to have a file open but none were active")]
    NoActiveFile,

    #[error("unexpected error `{0}`")]
    JsError(String),

    #[error("unknown error from js")]
    UnknownJsError,

    #[error("unknown syntax expected a url")]
    UnknownSyntax,

    #[error("error extracting content. {0}")]
    Parse(#[from] extract::ExtractError),
}

pub fn command_archive() -> ArchiveCommand {
    ArchiveCommand {
        id: JsString::from("extract-url"),
        name: JsString::from("Archive"),
    }
}

impl std::convert::From<JsValue> for ArchiveError {
    fn from(err: JsValue) -> Self {
        let err_val: &Result<Error, JsValue> = &err.dyn_into();
        if let Ok(err_val) = err_val {
            ArchiveError::JsError(err_val.to_string().as_string().unwrap())
        } else {
            ArchiveError::UnknownJsError
        }
    }
}

async fn archive_document(
    plugin: &obsidian::Plugin,
    settings: &Settings,
) -> Result<(), ArchiveError> {
    let app = plugin.app();
    let workspace = app.workspace();
    let vault = app.vault();
    let file_manager = app.file_manager();
    if let Some(active) = workspace.get_active_file() {
        let content_js: JsString = JsFuture::from(vault.read(&active)).await?.dyn_into()?;
        let mut content = String::from(content_js);
        let mut markdown_map: HashMap<String, MarkdownFile> = HashMap::new();
        for url in document_to_urls(&content)? {
            let msg = format!("archiving: {}", &url);
            obsidian::Notice::new(&msg);
            let md = url_to_markdown(&url).await?;
            let file = persist_markdown(settings, &vault, &url, &md).await?;
            markdown_map.insert(url, file);
        }
        content = URL_REGEX
            .replace_all(&content, |caps: &Captures| {
                let url = caps.name("url").unwrap();
                let md = markdown_map.get(url.as_str()).unwrap();
                let text = match caps.name("text") {
                    Some(x) => Some(x.as_str()),
                    None => Some(md.title.as_str()),
                };
                file_manager.generate_markdown_link(&md.file, &settings.archive_path(), None, text)
            })
            .into();
        JsFuture::from(vault.modify(&active, &content)).await?;
        obsidian::Notice::new(&"archive complete");
        Ok(())
    } else {
        Err(ArchiveError::NoActiveFile)
    }
}

fn document_to_urls(doc: &str) -> Result<impl Iterator<Item = String>, ArchiveError> {
    let mut urls = HashSet::new();
    for item in URL_REGEX.captures_iter(doc) {
        let url = item
            .unwrap()
            .name("url")
            .ok_or(ArchiveError::UnknownSyntax)?
            .as_str();
        urls.insert(String::from(url));
    }
    Ok(urls.into_iter())
}

async fn url_to_markdown(url: &str) -> Result<Markdown, ArchiveError> {
    Ok(extract::convert_url_to_markdown(false, url).await?)
}

struct MarkdownFile {
    title: String,
    pub file: obsidian::TFile,
}

#[wasm_bindgen(inline_js = r#" export function now() { return (+Date.now()).toString(); }"#)]
extern "C" {
    fn now() -> String;
}

fn markdown_to_filename(url: &str, title: &str) -> String {
    if let Ok(parsed) = Url::parse(&url) {
        if let Some(domain) = parsed.domain() {
            let no_dots = domain.replace(".", "_");
            return format!("{}.{}.md", &no_dots, title);
        }
    }
    format!("{}.md", title)
}

async fn persist_markdown(
    settings: &Settings,
    vault: &obsidian::Vault,
    url: &str,
    md: &Markdown,
) -> Result<MarkdownFile, ArchiveError> {
    let adapter = vault.adapter();
    let archive_path = settings.archive_path();
    JsFuture::from(adapter.mkdir(archive_path)?).await?;
    let title = &TITLE_REGEX.replace_all(&md.title, "");
    let filename = markdown_to_filename(&url, &title);
    let path = format!("{}/{}", archive_path, filename);
    let tfile: obsidian::TFile;
    if let Some(a_file) = vault.get_abstract_file_by_path(&path)? {
        let is_file: Result<obsidian::TFile, obsidian::TAbstractFile> = a_file.dyn_into();
        if let Ok(file) = is_file {
            tfile = file;
        } else {
            tfile = JsFuture::from(vault.create(&path, &md.content)?)
                .await?
                .dyn_into()?;
        }
    } else {
        tfile = JsFuture::from(vault.create(&path, &md.content)?)
            .await?
            .dyn_into()?;
    }
    Ok(MarkdownFile {
        title: md.title.to_owned(),
        file: tfile,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn url_regex() {
        assert!(URL_REGEX.is_match("[foo](https://foo.com)").unwrap());
        assert!(!URL_REGEX.is_match("# [foo](https://foo.com)").unwrap());
        assert!(URL_REGEX.is_match("# \n[foo](https://foo.com)").unwrap());
    }
}
