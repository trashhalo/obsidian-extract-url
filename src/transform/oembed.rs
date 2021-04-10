use crate::fetch;
use html2md::parse_html;
use serde::Deserialize;
use serde_json;
use thiserror::Error;
use url::Url;
use wasm_bindgen::{JsCast, JsValue};
use wasm_bindgen_futures::JsFuture;

#[derive(Error, Debug)]
pub enum OembedError {
    #[error("Url missing oembed info")]
    NoLink,

    #[error("Url missing oembed info")]
    NoHtml,

    #[error("Error fetching url for oembed")]
    Fetch(String),

    #[error("Error fetching url for oembed. {0}")]
    Url(#[from] url::ParseError),

    #[error("Error serializing oembed data. {0}")]
    Serde(#[from] serde_json::error::Error),
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

pub async fn oembed_content(_body: String, url: &Url) -> Result<String, OembedError> {
    let mut href = Url::parse("https://noembed.com/embed")?;
    href.query_pairs_mut().append_pair("url", &url.to_string());
    let resp_value = JsFuture::from(fetch::with_url(&href.to_string())).await?;
    let resp: fetch::Response = resp_value.dyn_into()?;
    let body = JsFuture::from(resp.json()?).await?;
    let data: OembedData = body.into_serde()?;
    match data.html {
        None => Err(OembedError::NoHtml),
        Some(html) => {
            if html.contains("iframe") {
                Ok(format!("# [{}]({})\n{}", data.title, url, html))
            } else {
                Ok(format!(
                    "# [{}]({})\n{}",
                    data.title,
                    url,
                    parse_html(&html)
                ))
            }
        }
    }
}

pub async fn oembed_title(_body: String, url: &Url) -> Result<String, OembedError> {
    let mut href = Url::parse("https://noembed.com/embed")?;
    href.query_pairs_mut().append_pair("url", &url.to_string());
    let resp_value = JsFuture::from(fetch::with_url(&href.to_string())).await?;
    let resp: fetch::Response = resp_value.dyn_into()?;
    let body = JsFuture::from(resp.json()?).await?;
    let data: OembedData = body.into_serde()?;
    Ok(format!("[{}]({})", data.title, url))
}
