import cheerio from "@trashhalo/cheerio"
import _ from "underscore";
import * as regexHelper from "./regexHelper";
import * as util from "./util";
import fetch from "node-fetch";

const Readability = (function () {
  /*
      get node's signature:class name + id
      @param {Object} node
      @return {String} signature
  */
  var _getSignature;

  class Readability {
    constructor(options1) {
      var defaultOptions, k;
      this.options = options1;
      defaultOptions = {
        content: "",
        debug: false
      };
      for (k in defaultOptions) {
        if (_.isUndefined(this.options[k])) {
          this.options[k] = defaultOptions[k];
        }
      }
      this.$ = cheerio.load(util.washHtml(this.options.content));
    }

    run() {
      var article, grabArticleElapsedMilliseconds, grabTileElapsedMilliseconds, res, startTime, title;
      startTime = new Date().getTime();
      title = this.grabTitle();
      grabTileElapsedMilliseconds = new Date().getTime() - startTime;
      article = this.grabArticle();
      grabArticleElapsedMilliseconds = new Date().getTime() - startTime;
      res = {
        title: title,
        text: article.text.trim(),
        html: article.html.trim(),
        url: this.options.url,
        time: {
          title: grabTileElapsedMilliseconds,
          article: grabArticleElapsedMilliseconds
        }
      };
      return res;
    }

    dbg() {
      if (this.options.debug) {
        return console.log.apply(this, arguments);
      }
    }

    grabTitle() {
      var _node, _score, _text, betterTitle, candidate, i, j, l, len, len1, len2, m, n, node, nodes, o, ref, tag, titleClass, titleNode, titleNodes;
      this.titleCandidates = [];
      titleNodes = this.$("head title");
      if (titleNodes.length !== 1) {
        return "";
      }
      this.title = cheerio(titleNodes[0]).text().trim();
      for (i = l = 1; l <= 3; i = ++l) {
        tag = `h${i}`;
        nodes = this.$(tag);
        for (j = m = 0, len = nodes.length; m < len; j = ++m) {
          node = nodes[j];
          _score = 9 - i - j; // calculate head score
          if (_score < 1) {
            _score = 1;
          }
          _node = cheerio(node);
          _text = _node.text().trim();
          if (!_text) {
            continue;
          }
          if (regexHelper.likeTitle(_getSignature(node))) {
            _score += 6;
          }
          _score = _score * (1 + this.getTextInTitleWeight(_text));
          this.titleCandidates.push({
            text: _text,
            score: _score
          });
        }
      }
      titleClass = this.$(".title");
      for (n = 0, len1 = titleClass.length; n < len1; n++) {
        titleNode = titleClass[n];
        _text = cheerio(titleNode).text().trim();
        if (!_text) {
          continue;
        }
        _score = 6;
        _score = _score * (1 + this.getTextInTitleWeight(_text));
        this.titleCandidates.push({
          text: _text,
          score: _score
        });
      }
      betterTitle = {
        score: 6,
        text: this.title
      };
      ref = this.titleCandidates;
      for (o = 0, len2 = ref.length; o < len2; o++) {
        candidate = ref[o];
        if (candidate.score > betterTitle.score) {
          betterTitle = candidate;
        }
      }
      return betterTitle.text;
    }

    /*
        grab article content
    */
    grabArticle() {
      var l, len, node, ref;
      this.removeUnlikelyNode();
      this.selectCandidates();
      this.selectTopCandidate();
      this.pullAllGoodNodes();
      this.articleContent = cheerio("<div></div>");
      ref = this.goodNodes;
      for (l = 0, len = ref.length; l < len; l++) {
        node = ref[l];
        this.articleContent.append(node);
      }
      this.prepArticle();
      return {
        text: this.articleContent.text(),
        html: this.articleContent.html()
      };
    }

    /*
        text is one of title pieces,may be a good title
        @param {String} text
        @return {Boolean}
    */
    getTextInTitleWeight(text) {
      if (this.title.indexOf(text) !== -1) {
        return text.length / this.title.length;
      }
      return 0;
    }

    /*
        remove unlikely content node
        @param {Object} htmlObj cheerio object
    */
    removeUnlikelyNode() {
      var _sign, allElements, continueFlag, elem, l, len, newNode, node, results, tagName;
      allElements = this.$("*");
      results = [];
      for (l = 0, len = allElements.length; l < len; l++) {
        elem = allElements[l];
        node = cheerio(elem);
        _sign = _getSignature(elem);
        tagName = elem.name;
        continueFlag = false;
        //remove unlikely candidate node
        if (_sign && (tagName !== "body") && regexHelper.unlikelyCandidates(_sign) && (!regexHelper.okMaybeItsACandidate(_sign))) {
          node.remove();
          this.dbg(`remove node:${_sign}`);
          continueFlag = true;
        }
        //turn all dives that don't have children block level elements into p
        if ((!continueFlag) && (tagName === "div")) {
          if (regexHelper.divToPElements(node.html())) { //这里搜索字符串可能不准确
            newNode = cheerio("<p></p>");
            newNode.html(node.html());
            results.push(node.replaceWith(newNode));
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    }

    /*
        select out candidates
        @param {Object} htmlObj cheerio object
        @return {Array} candidates array
    */
    selectCandidates() {
      var allPElements, contentScore, elem, grandParentNode, innerText, l, len, node, parentNode;
      this.candidates = [];
      allPElements = this.$("p");
      for (l = 0, len = allPElements.length; l < len; l++) {
        elem = allPElements[l];
        node = cheerio(elem);
        parentNode = elem.parent;
        if (!parentNode) {
          continue;
        }
        if (_.isUndefined(parentNode.score)) {
          util.initializeNode(parentNode);
          this.candidates.push(parentNode);
        } else {
          this.dbg(`parent score:${parentNode.score}`);
        }
        grandParentNode = parentNode.parent;
        if (grandParentNode && _.isUndefined(grandParentNode.score)) {
          util.initializeNode(grandParentNode);
          this.candidates.push(grandParentNode);
        } else {
          if (!_.isUndefined(grandParentNode)) {
            this.dbg(`grantParent score:${grandParentNode.score}`);
          }
        }
        innerText = node.text();
        if (util.justWords(innerText)) {
          this.dbg(`may be just words => ${innerText}`);
          continue;
        }
        contentScore = util.contentScore(innerText);
        parentNode.score += contentScore;
        if (!_.isUndefined(grandParentNode)) {
          grandParentNode.score += contentScore / 2;
        }
      }
      return this.dbg(`candidates count:${this.candidates.length}`);
    }

    /*
        select out top candidates
        @param {Array} candidates
        @return {Object} top candidate
    */
    selectTopCandidate() {
      var candidate, i, l, len, linkDensity, ref;
      ref = this.candidates;
      for (i = l = 0, len = ref.length; l < len; i = ++l) {
        candidate = ref[i];
        linkDensity = util.getLinkDensity(candidate);
        if (linkDensity > 0) {
          candidate.score = candidate.score * (1 - linkDensity);
        }
        if ((!this.topCandidate) || (candidate.score > this.topCandidate.score)) {
          this.dbg("find new better candidate");
          this.topCandidate = candidate;
        }
      }
      // if we still have no top candidate,use the body
      if (this.topCandidate === null || this.topCandidate.name === "body") {
        this.topCandidate = cheerio("<div></div>").html(cheerio(this.topCandidate).html())[0];
        return util.initializeNode(this.topCandidate);
      }
    }

    /*
        pull out all good nodes according to top candidate
        @param {Object} topCandidate
        @return {Array} good nodes array
    */
    pullAllGoodNodes() {
      var $sibling, append, contentBonus, innerText, l, len, linkDensity, results, sibling, siblingClassName, siblingNodes, siblingScoreThreshold, topCandidateClassName;
      this.goodNodes = [];
      siblingNodes = [];
      if (this.topCandidate.parent) {
        siblingNodes = this.topCandidate.parent.children;
      }
      if (siblingNodes.length > 0) {
        this.dbg(`sibling count:${siblingNodes.length}`);
        topCandidateClassName = this.topCandidate.attribs["class"];
        siblingScoreThreshold = Math.max(10, this.topCandidate.score * 0.2);
        results = [];
        for (l = 0, len = siblingNodes.length; l < len; l++) {
          sibling = siblingNodes[l];
          append = false;
          if (sibling === this.topCandidate) {
            append = true;
          } else {
            contentBonus = 0;
            if (topCandidateClassName && sibling.attribs && sibling.attribs["class"]) {
              siblingClassName = sibling.attribs["class"];
              if (topCandidateClassName && (topCandidateClassName === siblingClassName)) {
                contentBonus += this.topCandidate.score * 0.2;
              }
            }
            if ((!_.isUndefined(sibling.score)) && (sibling.score + contentBonus) >= siblingScoreThreshold) {
              append = true;
            }
            if (sibling.name === "p") {
              $sibling = cheerio(sibling);
              innerText = $sibling.text();
              linkDensity = util.getLinkDensity($sibling);
              if (innerText.length > 80 && linkDensity < 0.25) {
                append = true;
              } else if (innerText.length <= 80 && linkDensity === 0 && (innerText.search(/\.( | $)/) !== -1)) {
                append = true;
              }
            }
          }
          if (append) {
            results.push(this.goodNodes.push(sibling));
          } else {
            results.push(void 0);
          }
        }
        return results;
      } else {
        return this.goodNodes.push(this.topCandidate);
      }
    }

    /*
        prepare article,clean html
    */
    prepArticle() {
      util.killBreaks(this.articleContent);
      util.clean(this.articleContent, "form");
      util.clean(this.articleContent, "object");
      util.clean(this.articleContent, "h1");
      util.clean(this.articleContent, "input");
      util.clean(this.articleContent, "textarea");
      util.clean(this.articleContent, "iframe");
      if (this.articleContent.find('h2').length === 1) {
        util.clean(this.articleContent, "h2");
      }
      util.cleanHeaders(this.articleContent);
      util.cleanConditionally(this.articleContent, "table");
      util.cleanConditionally(this.articleContent, "ul");
      util.cleanConditionally(this.articleContent, "div");
      util.removeExtraParagraph(this.articleContent);
      util.removeSingleHeader(this.articleContent);
      util.trimAttributes(this.articleContent);
      return util.pullOutRealPath(this.articleContent, this.options.url);
    }

  };

  _getSignature = function (node) {
    var ref, ref1;
    return (((ref = node.attribs) != null ? ref.class : void 0) || "") + (((ref1 = node.attribs) != null ? ref1.id : void 0) || "");
  };

  return Readability;

}).call(this);

export function parse(options, cb) {
  var read;
  if (_.isObject(options)) {
    read = new Readability(options);
    return cb(null, read.run());
  } else if (_.isString(options) && util.isURL(options)) {
    return fetch(options)
      .then(res => res.text())
      .then(text => {
        read = new Readability({
          url: options,
          content: text
        });
        return cb(null, read.run());
      })
      .catch((err) => cb(err))
  } else if (_.isString(options)) {
    read = new Readability({
      content: options
    });
    return cb(null, read.run());
  } else {
    return cb(new Error("invalid parameter"));
  }
}
