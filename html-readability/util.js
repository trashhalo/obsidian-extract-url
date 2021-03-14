import * as regexHelper from "./regexHelper";
import $ from "@trashhalo/cheerio";
import _ from "underscore";
import url from "url";

/*
    trim script tag
    @param {String} html html content
*/
export function washHtml(html) {
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  return html;
};

/*
    initialize a node with content score
    @param {Object} node
*/
export function initializeNode(node) {
  var e, score;
  score = 0;
  switch (node.name) {
    case "object":
    case "embed":
      try {
        if (regexHelper.isVideo(node.attribs["src"])) {
          score += 10;
        }
      } catch (error) {
        e = error;
        console.dir(e);
      }
      break;
    case "div":
      score += 5;
      break;
    case "pre":
    case "td":
    case "blockquote":
    case "img":
      score += 3;
      break;
    case "address":
    case "ol":
    case "ul":
    case "dl":
    case "dd":
    case "dt":
    case "li":
    case "form":
      score -= 3;
      break;
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
    case "th":
      score -= 5;
  }
  score += getClassAndIdWeight(node);
  return node.score = score;
};

export function getLinkDensity(node) {
  if (!(node instanceof $)) {
    node = $(node);
  }
  return node.find("a").text().length / node.text();
};

/*
    detect input is just some words(more than 5 words)
    @param {String} input
*/
export function justWords(input) {
  input = input.trim();
  if (containsChinese(input)) {
    return input.length < 10;
  } else {
    return input.length < 25;
  }
};

/*
    calculate content score
    @param {String} input content
*/
export function contentScore(input) {
  var score;
  score = 1;
  input = input.trim();
  score += input.replace(",", ',').split(',').length;
  if (containsChinese(input)) {
    score + Math.min(Math.floor(input.length / 40), 3);
  } else {
    score + Math.min(Math.floor(input.length / 100), 3);
  }
  return score;
};

/*
    kill all breaks
*/
export function killBreaks(node) {
  return node.html(regexHelper.replaceBreaks(node.html()));
};

/*
    clean tag
    @param {Object} node
    @param {String} tag tag name
*/
export function clean(node, tag) {
  var _node, isEmbed, j, len, n, results, targetArray;
  isEmbed = tag === "object" || tag === "embed";
  targetArray = node.find(tag);
  results = [];
  for (j = 0, len = targetArray.length; j < len; j++) {
    n = targetArray[j];
    _node = $(n);
    if (isEmbed && regexHelper.isVideo(_node.html())) {
      continue;
    }
    results.push(_node.remove());
  }
  return results;
};

/*
    clean headers
    @param {Object} node cheerio node
*/
export function cleanHeaders(node) {
  var header, headerIndex, headers, j, results;
  results = [];
  for (headerIndex = j = 2; j <= 3; headerIndex = ++j) {
    headers = node.find("h" + headerIndex);
    results.push((function () {
      var k, len, results1;
      results1 = [];
      for (k = 0, len = headers.length; k < len; k++) {
        header = headers[k];
        if (getClassAndIdWeight(header) < 0 || getLinkDensity(header) > 0.33) {
          results1.push(header.remove());
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    })());
  }
  return results;
};

export function cleanConditionally(node, tag) {
  var _n, contentLength, em, embedCount, embeds, imgLength, inputLength, j, k, len, len1, liLength, linkDensity, n, pLength, results, score, tagList, toRemove, weight;
  tagList = node.find(tag);
  if (tagList.length > 0) {
    results = [];
    for (j = 0, len = tagList.length; j < len; j++) {
      n = tagList[j];
      weight = getClassAndIdWeight(n);
      score = n.score || 0;
      _n = $(n);
      if ((weight + score) < 0) {
        results.push(_n.remove());
      } else if (_n.text().replace("，", ",").split(',').length < 10) {
        //if there are not very many commas,and the number of
        //non-paragraph elements is more that paragraphs or other ominous signs
        //remove the element.
        pLength = _n.find("p").length;
        imgLength = _n.find("img").length;
        liLength = _n.find("li").length;
        inputLength = _n.find("input").length;
        embedCount = 0;
        embeds = _n.find("embed");
        for (k = 0, len1 = embeds.length; k < len1; k++) {
          em = embeds[k];
          if (regexHelper.isVideo($(em).attr("src"))) { //是否不用这样取
            embedCount += 1;
          }
        }
        contentLength = _n.text().length;
        linkDensity = getLinkDensity(_n);
        toRemove = false;
        if (imgLength > pLength) {
          toRemove = true;
        } else if (liLength > pLength && (tag !== "ul") && (tag !== "ol")) {
          toRemove = true;
        } else if (inputLength > Math.floor(pLength / 3)) {
          toRemove = true;
        } else if (weight < 25 && linkDensity > 0.2) {
          toRemove = true;
        } else if (weight >= 24 && linkDensity > 0.5) {
          toRemove = true;
        } else if ((embedCount === 1 && contentLength < 75) || embedCount > 1) {
          toRemove = true;
        }
        if (toRemove) {
          results.push(_n.remove());
        } else {
          results.push(void 0);
        }
      } else {
        results.push(void 0);
      }
    }
    return results;
  }
};

/*
    remove extra paragraphs
    @param {Object} node
*/
export function removeExtraParagraph(node) {
  var _n, embedCount, imgCount, j, len, objectCount, para, paragraphs, results;
  paragraphs = node.find("p");
  results = [];
  for (j = 0, len = paragraphs.length; j < len; j++) {
    para = paragraphs[j];
    _n = $(para);
    imgCount = _n.find("img").length;
    embedCount = _n.find("embed").length;
    objectCount = _n.find("object").length;
    if (imgCount === 0 && embedCount === 0 && objectCount === 0 && _n.text().trim() === "") {
      results.push(_n.remove());
    } else {
      results.push(void 0);
    }
  }
  return results;
};

/*
    remove the header that doesn't have next siblings
*/
export function removeSingleHeader(node) {
  var header, headerIndex, headers, j, results;
  results = [];
  for (headerIndex = j = 1; j <= 6; headerIndex = ++j) {
    headers = $(node).find(`h${headerIndex}`);
    results.push((function () {
      var k, len, results1;
      results1 = [];
      for (k = 0, len = headers.length; k < len; k++) {
        header = headers[k];
        if (_.isNull(header.next) && _.isNull(header.prev)) {
          results1.push($(header).remove());
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    })());
  }
  return results;
};

/*
    remove attributes
    @param {Object} node cheerio node
*/
export function trimAttributes(node) {
  var all, attr, j, len, n, proAttrs, results;
  all = node.find("*");
  results = [];
  for (j = 0, len = all.length; j < len; j++) {
    n = all[j];
    proAttrs = ['srv'];
    if (n.name !== "object" && n.name !== "embed") {
      proAttrs.push('href');
      proAttrs.push('width'); //TODO:图片的宽度高度应该留一个
    }
    results.push((function () {
      var k, len1, ref, results1;
      ref = n.attribs;
      results1 = [];
      for (k = 0, len1 = ref.length; k < len1; k++) {
        attr = ref[k];
        if (indexOf.call(proAttrs, attr) < 0) { //TODO:是否可以通过直接 delete 呢
          results1.push($(n).removeAttr(attr));
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    })());
  }
  return results;
};

/*
    replace relative path with real path
    @param {Object} node
    @param {String} baseUrl
*/
export function pullOutRealPath(node, baseUrl) {
  var imgs, links;
  if (baseUrl) {
    imgs = node.find('img');
    imgs.each(function (i, img) {
      var realPath;
      realPath = img.attribs['src'];
      _.each(img.attribs, function (value, key) {
        if (isURL(value) && (value !== realPath || (!realPath))) {
          return realPath = value;
        }
      });
      return img.attribs['src'] = isURL(realPath) ? realPath : url.resolve(baseUrl, realPath);
    });
    links = node.find('a');
    return links.each(function (i, link) {
      if (link.attribs['href']) {
        return link.attribs['href'] = url.resolve(baseUrl, link.attribs['href']);
      }
    });
  }
};

function containsChinese(str) {
  return escape(str).indexOf("%u") !== -1;
};

function getClassAndIdWeight(node) {
  var className, desc, id, weight;
  weight = 0;
  if (node.attribs) {
    className = node.attribs['class'];
    id = node.attribs["id"];
    desc = className + id;
    if (!desc) {
      return weight;
    }
    if (regexHelper.isNegative(desc)) {
      weight -= 25;
    }
    if (regexHelper.isPositive(desc)) {
      weight += 25;
    }
  }
  return weight;
};

export function isURL(path) {
  var urlRegex;
  urlRegex = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
  return urlRegex.test(path);
};