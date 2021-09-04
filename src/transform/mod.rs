mod oembed;
use html2md::parse_html;
use readability::extractor::extract;
use thiserror::Error;
use url::Url;
use web_sys::console;

#[derive(Error, Debug)]
pub enum TransformError {
    #[error("url not readable. {0}")]
    Read(#[from] readability::error::Error),

    #[error("error converting oembed data. {0}")]
    Oembed(#[from] oembed::OembedError),
}

pub async fn readable_content(body: String, url: &Url) -> Result<String, TransformError> {
    let ref mut b = body.as_bytes();
    let readable = extract(b, url)?;

    Ok(format!(
        "# [{}]({})\n{}",
        readable.title,
        url,
        parse_html(&readable.content)
    ))
}

pub async fn readable_title(body: String, url: &Url) -> Result<String, TransformError> {
    let ref mut b = body.as_bytes();
    let readable = extract(b, url)?;

    Ok(format!("[{}]({})", readable.title, url))
}

pub async fn transform_url(
    url: &Url,
    title_only: bool,
    body: String,
) -> Result<String, TransformError> {
    if title_only {
        match oembed::oembed_title(body.clone(), url).await {
            Ok(o) => Ok(o),
            Err(e) => {
                console::log_2(&"oembed error".into(), &format!("{:?}", e).into());
                readable_title(body.clone(), url).await
            }
        }
    } else {
        match oembed::oembed_content(body.clone(), url).await {
            Ok(o) => Ok(o),
            Err(e) => {
                console::log_2(&"oembed error".into(), &format!("{:?}", e).into());
                readable_content(body.clone(), url).await
            }
        }
    }
}
