use crate::shim::{has_bin, node_exec};
use futures::channel::oneshot;
use js_sys::Error;
use serde::Deserialize;
use serde_json;
use thiserror::Error;
use url::{Host, Url};
use wasm_bindgen::prelude::*;
use web_sys::console;

#[derive(Error, Debug)]
pub enum ExecError {
    #[error("error executing command. {0} {1}")]
    Error(String, String),

    #[error("oneshot caneled")]
    Canceled(#[from] oneshot::Canceled),
}

async fn exec(cmd: &str) -> Result<Option<String>, ExecError> {
    let (sender, receiver) = oneshot::channel::<Result<String, ExecError>>();
    let cb = Closure::once(|err_val: Option<Error>, out: String, out_err: String| {
        let res = match err_val {
            None => sender.send(Ok(out)),
            Some(err) => {
                let msg: String = err.message().into();
                sender.send(Err(ExecError::Error(msg, out_err)))
            }
        };
        res.unwrap();
    });
    node_exec(cmd, &cb);
    let body = receiver.await??;
    Ok(Some(body))
}

#[derive(Debug, Deserialize)]
pub struct VideoMetadata {
    pub channel: String,
    pub uploader_url: String,
    pub description: String,
}

#[derive(Error, Debug)]
pub enum MetadataError {
    #[error("error running youtube-dl {0}")]
    Exec(#[from] ExecError),

    #[error("Error serializing youtub data. {0}")]
    Serde(#[from] serde_json::error::Error),
}

pub async fn metadata(url: &Url) -> Result<Option<VideoMetadata>, MetadataError> {
    if !is_youtube(url) {
        return Ok(None);
    } else if !has_bin("youtube-dl") {
        return Ok(None);
    }
    console::log_1(&"detected youtube-dl".into());
    match exec(&format!("youtube-dl -j {}", url)).await? {
        None => Ok(None),
        Some(s) => {
            let m: VideoMetadata = serde_json::from_str(&s)?;
            Ok(Some(m))
        }
    }
}

fn is_youtube(url: &Url) -> bool {
    match url.host() {
        Some(Host::Domain("youtu.be"))
        | Some(Host::Domain("youtube.com"))
        | Some(Host::Domain("www.youtube.com")) => true,
        _ => false,
    }
}
