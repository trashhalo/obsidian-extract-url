var regexps;

regexps = {
  unlikelyCandidates: /combx|comment|community|disqus|extra|foot|header|menu|remark|rss|shoutbox|sidebar|sponsor|ad-break|agegate|pager|popup|tweet|twitter/i,
  okMaybeItsACandidate: /and|article|body|column|main|shadow/i,
  positive: /article|body|content|entry|hentry|main|page|pagination|post|text|blog|story/i,
  negative: /combx|comment|com-|contact|foot|footer|footnote|masthead|media|meta|outbrain|promo|related|scroll|shoutbox|sidebar|sponsor|shopping|tags|tool|widget/i,
  extraneous: /print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single/i,
  divToPElements: /<(a|blockquote|dl|div|img|ol|p|pre|table|ul)/i,
  replaceBrs: /(<br[^>]*>[ \n\r\t]*){2,}/gi,
  replaceFonts: /<(\/?)font[^>]*>/gi,
  trim: /^\s+|\s+$/g,
  normalize: /\s{2,}/g,
  killBreaks: /(<br\s*\/?>(\s|&nbsp;?)*){1,}/g,
  videos: /youtube|vimeo|youku|tudou|56|yinyuetai|video\.sina/i,
  skipFootnoteLink: /^\s*(\[?[a-z0-9]{1,2}\]?|^|edit|citation needed)\s*$/i,
  nextLink: /(next|weiter|continue|next_page|>([^\|]|$)|([^\|]|$))/i, // Match: next, continue, >, >>, ? but not >|, ?| as those usually mean last.
  prevLink: /(prev|earl|old|new|<|)/i,
  indexLink: /http.*(\\.com\.cn|.net|\.com|\.cn)/i,
  title: /title|head/gi
};

export function unlikelyCandidates(str) {
  return str.search(regexps.unlikelyCandidates) !== -1;
}

export function okMaybeItsACandidate(str) {
  return str && str.search(regexps.okMaybeItsACandidate) !== -1;
}

export function isVideo(str) {
  return str && str.search(regexps.videos) !== -1;
}

export function divToPElements(str) {
  return str && str.search(regexps.divToPElements) !== -1;
}

export function isNegative(str) {
  return str.search(regexps.negative) !== -1;
}

export function isPositive(str) {
  return str && str.search(regexps.positive) !== -1;
}

export function replaceBreaks(str) {
  return str.replace(regexps.killBreaks, '<br />');
}

export function likeTitle(str) {
  return str && str.search(regexps.title) !== -1;
}