use crate::request;
use crate::transform::Markdown;
use fancy_regex::Captures;
use fancy_regex::Regex;
use lazy_static::lazy_static;
use scraper::Html;
use scraper::Selector;
use std::fmt;
use thiserror::Error;
use url::Url;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;

lazy_static! {
    static ref RELATIVE_URL_REGEX: Regex =
        Regex::new(r"!\[(?P<text>.*)\]\((?P<url>\w.*)\)").unwrap();
}

pub fn is_repo(url: &Url) -> bool {
    if let Some(domain) = url.domain() {
        if domain.eq("github.com") {
            if url.path().matches("/").count() == 2 {
                return true;
            }
        }
    }
    false
}

fn github_content_url(user: &str, repo: &str, branch: &Branch, path: &str) -> String {
    format!(
        "https://raw.githubusercontent.com/{}/{}/{}/{}",
        user, repo, branch, path
    )
}

#[derive(Debug, PartialEq)]
struct Repo {
    user: String,
    repo: String,
}

fn github_repo_to_readme_urls(url: &Url) -> (Repo, Vec<(Branch, Url)>) {
    let mut segments = url.path_segments().unwrap();
    let user = segments.next().unwrap();
    let repo = segments.next().unwrap();
    (
        Repo {
            user: user.to_string(),
            repo: repo.to_string(),
        },
        vec![
            (
                Branch::Master,
                Url::parse(&github_content_url(
                    &user,
                    &repo,
                    &Branch::Master,
                    &"README.md",
                ))
                .unwrap(),
            ),
            (
                Branch::Main,
                Url::parse(&github_content_url(
                    &user,
                    &repo,
                    &Branch::Main,
                    &"README.md",
                ))
                .unwrap(),
            ),
        ],
    )
}

#[derive(Error, Debug)]
pub enum GithubError {
    #[error("readme not found")]
    NoReadme(),

    #[error("fetch error `{0}`")]
    Fetch(String),
}

impl std::convert::From<wasm_bindgen::JsValue> for GithubError {
    fn from(err: JsValue) -> Self {
        if let Some(err_val) = err.as_string() {
            GithubError::Fetch(format!("fetch error {}", err_val))
        } else {
            GithubError::Fetch(String::from("fetch error"))
        }
    }
}

pub async fn transform_url(
    url: &Url,
    title_only: bool,
    body: String,
) -> Result<Markdown, GithubError> {
    let title = body_to_title(&body).unwrap();
    if title_only {
        return Ok(Markdown {
            title: title.clone(),
            content: format!("[{}]({})", title, url),
        });
    }

    let (repo, urls) = github_repo_to_readme_urls(url);
    let (branch, readme) = first_working_url(&urls).await?;
    let fixed_readme = fix_relative_urls(&repo, &branch, &readme);
    Ok(Markdown {
        title: title.clone(),
        content: fixed_readme,
    })
}

#[derive(Clone, Debug, PartialEq)]
enum Branch {
    Master,
    Main,
}

impl fmt::Display for Branch {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Branch::Master => write!(f, "master"),
            Branch::Main => write!(f, "main"),
        }
    }
}

async fn first_working_url(urls: &[(Branch, Url)]) -> Result<(Branch, String), GithubError> {
    for url in urls {
        let params = request::request_params(url.1.as_str());
        if let Ok(body) = JsFuture::from(request::request(params)?).await {
            return Ok((url.0.clone(), body.as_string().unwrap()));
        }
    }
    Err(GithubError::NoReadme())
}

fn body_to_title(body: &str) -> Option<String> {
    let doc = Html::parse_document(body);
    let selector = Selector::parse("meta[name=\"twitter:title\"]").unwrap();
    doc.select(&selector)
        .nth(0)
        .map(|node| node.value().attr(&"content"))
        .flatten()
        .map(|attr| attr.to_string())
}

fn fix_relative_urls(repo: &Repo, branch: &Branch, body: &str) -> String {
    RELATIVE_URL_REGEX
        .replace_all(body, |caps: &Captures| {
            let url = caps.name("url").unwrap().as_str();
            let text = caps.name("text").map(|o| o.as_str()).unwrap_or("");
            let fixed_url = github_content_url(&repo.user, &repo.repo, branch, url);
            format!("![{}]({})", text, fixed_url)
        })
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_repo() {
        assert!(is_repo(
            &Url::parse(&"https://github.com/Restioson/xtra").unwrap()
        ));
        assert!(!is_repo(
            &Url::parse(&"https://github.com/Restioson/xtra/commits/master").unwrap()
        ));
    }

    #[test]
    fn test_github_repo_to_readme_urls() {
        assert_eq!(
            github_repo_to_readme_urls(&Url::parse(&"https://github.com/Restioson/xtra").unwrap()),
            (
                Repo {
                    user: String::from("Restioson"),
                    repo: String::from("xtra")
                },
                vec!(
                    (
                        Branch::Master,
                        Url::parse(
                            "https://raw.githubusercontent.com/Restioson/xtra/master/README.md"
                        )
                        .unwrap()
                    ),
                    (
                        Branch::Main,
                        Url::parse(
                            "https://raw.githubusercontent.com/Restioson/xtra/main/README.md"
                        )
                        .unwrap()
                    )
                )
            )
        );
    }

    #[test]
    fn test_body_to_title() {
        assert_eq!(
            body_to_title("<html><head><meta name=\"twitter:title\" content=\"Restioson/xtra: 🎭 A tiny actor framework\" /></head></html>"),
            Some(String::from("Restioson/xtra: 🎭 A tiny actor framework"))
        );

        assert_eq!(body_to_title("<html><head></head></html>"), None);
    }
}
