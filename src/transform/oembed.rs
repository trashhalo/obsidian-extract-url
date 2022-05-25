mod metadata;
use crate::extract::Markdown;
use crate::request;
use html2md::parse_html;
use serde::Deserialize;
use serde_json;
use thiserror::Error;
use url::Url;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;
use web_sys::console;

#[derive(Error, Debug)]
pub enum OembedError {
    #[error("Url missing oembed info")]
    NoHtml,

    #[error("Error fetching url for oembed")]
    Fetch(String),

    #[error("Error fetching url for oembed. {0}")]
    Url(#[from] url::ParseError),

    #[error("Error serializing oembed data. {0}")]
    Serde(#[from] serde_json::error::Error),

    #[error("Error getting youtube metadata")]
    Metadata(#[from] metadata::MetadataError),
}

impl std::convert::From<wasm_bindgen::JsValue> for OembedError {
    fn from(err: JsValue) -> Self {
        if let Some(err_val) = err.as_string() {
            OembedError::Fetch(format!("fetch error {}", err_val))
        } else {
            OembedError::Fetch(String::from("fetch error"))
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct OembedData {
    pub html: Option<String>,
    pub title: String,
}

pub async fn oembed_content(_body: String, url: &Url) -> Result<Markdown, OembedError> {
    let m = match metadata::metadata(url).await {
        Err(e) => {
            console::log_2(&"metadata error".into(), &format!("{:?}", e).into());
            None
        }
        Ok(o) => o,
    };

    let mut href = Url::parse("https://noembed.com/embed")?;
    href.query_pairs_mut().append_pair("url", &url.to_string());
    let params = request::request_params(href.as_str());
    let body = JsFuture::from(request::request(params)?)
        .await?
        .as_string()
        .ok_or_else(|| OembedError::Fetch("Value not a string".into()))?;

    if cfg!(debug_assertions) {
        let dbody = body.clone();
        console::log_2(&"oembed".into(), &dbody.into());
    }

    let data: OembedData = serde_json::from_str(&body)?;
    match data.html {
        None => Err(OembedError::NoHtml),
        Some(html) => {
            if html.contains("iframe") {
                match m {
                    None => Ok(Markdown{
                        title: data.title.clone(),
                        content: format!("# [{}]({})\n{}", data.title, url, html)
                    }),
                    Some(video) => Ok(Markdown{
                        title: data.title.clone(),
                        content: format!(
                        "# [{}]({})\n{}\n\n[{}]({})\n{}",
                        data.title, url, html, video.channel, video.uploader_url, video.description
                    )}),
                }
            } else {
                Ok(Markdown {
                    title: data.title.clone(),
                    content: format!(
                    "# [{}]({})\n{}",
                    data.title,
                    url,
                    parse_html(&html)
                )})
            }
        }
    }
}

pub async fn oembed_title(_body: String, url: &Url) -> Result<Markdown, OembedError> {
    let mut href = Url::parse("https://noembed.com/embed")?;
    href.query_pairs_mut().append_pair("url", &url.to_string());
    let params = request::request_params(url.as_str());
    let body = JsFuture::from(request::request(params)?).await?;
    let data: OembedData = body.into_serde()?;
    Ok(Markdown{
        title: data.title.clone(),
        content: format!("[{}]({})", data.title, url)
    })
}
