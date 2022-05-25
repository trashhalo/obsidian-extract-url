use crate::obsidian::Plugin;
use js_sys::Promise;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(method, js_name=loadData)]
    fn load_data(this: &Plugin) -> Promise;

    #[wasm_bindgen(method, js_name=saveData)]
    fn save_data(this: &Plugin, data: JsValue) -> Promise;
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Settings {
    pub archive_path: Option<String>,
}

impl Settings {
    pub fn archive_path(self: &Self) -> &str {
        match &self.archive_path {
            Some(s) => s,
            None => "archive",
        }
    }
}

#[derive(Error, Debug)]
pub enum SettingsError {
    #[error("Error deserializing setting data. {0}")]
    Serde(#[from] serde_json::error::Error),
    #[error("unexpected error `{0}`")]
    JsError(String),

    #[error("unknown error from js")]
    UnknownJsError,
}

impl std::convert::From<JsValue> for SettingsError {
    fn from(err: JsValue) -> Self {
        if let Some(err_val) = err.as_string() {
            SettingsError::JsError(err_val)
        } else {
            SettingsError::UnknownJsError
        }
    }
}

pub async fn load_settings(plugin: &Plugin) -> Result<Settings, SettingsError> {
    let value: Option<Settings> = JsFuture::from(plugin.load_data()).await?.into_serde()?;
    Ok(match value {
        Some(settings) => settings,
        None => Settings { archive_path: None },
    })
}

pub async fn save_settings(plugin: &Plugin, settings: Settings) -> Result<(), SettingsError> {
    let value = JsValue::from_serde(&settings)?;
    JsFuture::from(plugin.save_data(value)).await?;
    Ok(())
}
