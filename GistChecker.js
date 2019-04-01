/**
 * GitHub: https://github.com/tanaikech/GistChecker <br>
 * Main method.<br>
 * @param {Object} object Object including own account information.
 * @return {Object} Object including the response.
 */
function Do(object) {
    return new GistChecker(object).Do();
}
;
(function(r) {
  var GistChecker;
  GistChecker = (function() {
    var checkDiff, getItemsFromGists, getReqHeaders, getSpreadsheet, getStargazersAndForks, parseHTML, parseLink, parseQuery, putLog, sendNoticicationMail, updateSheet;

    GistChecker.name = "GistChecker";

    function GistChecker(obj_) {
      var dataSheet;
      this.name = "GistChecker";
      this.startTime = new Date();
      this.obj = obj_;
      this.baseUrl = "https://api.github.com/gists";
      dataSheet = "Data_" + this.name;
      this.logSheet = "Log_" + this.name;
      this.reqHeaders = getReqHeaders.call(this);
      this.sheet = getSpreadsheet.call(this, dataSheet);
      this.header = ["id", "created_at", "updated_at", "public", "comments", "description", "html_url"];
      this.response = {
        startTime: this.startTime.toISOString()
      };
    }

    GistChecker.prototype.Do = function() {
      var diff, err, items, ref;
      ref = getItemsFromGists.call(this), items = ref[0], err = ref[1];
      if (err) {
        if (!this.obj.log) {
          throw new Error(err);
        }
        this.response.error = err;
        putLog.call(this);
        return this.response;
      }
      if (this.obj.getStarsAndForks) {
        Array.prototype.push.apply(this.header, ["star", "fork"]);
        items = getStargazersAndForks.call(this, items);
      }
      this.response.totalGists = items.length;
      if (this.response.totalGists > 0) {
        diff = checkDiff.call(this, items, this.sheet.getDataRange().getValues());
        updateSheet.call(this, items);
        if (diff.length > 0) {
          sendNoticicationMail.call(this, diff);
        } else {
          this.response.changedGists = 0;
        }
      }
      this.response.executionTime = (Date.now() - this.startTime.getTime()) / 1000;
      if (this.obj.log) {
        putLog.call(this);
      }
      return this.response;
    };

    getReqHeaders = function() {
      if (this.obj.accessToken) {
        return {
          Authorization: "token " + this.obj.accessToken
        };
      } else if (this.obj.username && this.obj.password) {
        return {
          Authorization: "Basic " + Utilities.base64Encode(this.obj.username + ":" + this.obj.password)
        };
      }
      throw new Error("Please use your account for GitHub or access token for GitHub you retrieved.");
    };

    getSpreadsheet = function(sheetName_) {
      var sheet, ss;
      ss = this.obj && this.obj.spreadsheetId ? SpreadsheetApp.openById(this.obj.spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        sheet = ss.getSheetByName(sheetName_);
        if (!sheet) {
          sheet = ss.insertSheet(sheetName_);
        }
        return sheet;
      }
      throw new Error("Spreadsheet was not found.");
    };

    getItemsFromGists = function() {
      var errChk, i, items, j, link, page, ref, reqs, res, temp, url;
      url = this.baseUrl + "?page=1&per_page=100";
      r = UrlFetchApp.fetch(url, {
        headers: this.reqHeaders,
        muteHttpExceptions: true
      });
      if (r.getResponseCode() !== 200) {
        return [null, r.getContentText()];
      }
      items = JSON.parse(r);
      link = r.getHeaders().Link;
      if (link) {
        page = parseLink.call(this, link);
        if (page.last) {
          reqs = [];
          for (i = j = 1, ref = page.last.page; 1 <= ref ? j < ref : j > ref; i = 1 <= ref ? ++j : --j) {
            reqs.push({
              url: this.baseUrl + "?page=" + (i + 1) + "&per_page=100",
              headers: this.reqHeaders,
              muteHttpExceptions: true
            });
          }
          res = UrlFetchApp.fetchAll(reqs);
          errChk = res.filter(function(e) {
            return e.getResponseCode() !== 200;
          });
          if (errChk.length > 0) {
            return [
              null, JSON.stringify(errChk.map(function(e) {
                return e.getContentText();
              }))
            ];
          }
          temp = res.map(function(e) {
            return JSON.parse(e.getContentText());
          });
          temp = Array.prototype.concat.apply([], temp);
          Array.prototype.push.apply(items, temp);
        }
      }
      items.reverse();
      return [items, null];
    };

    parseLink = function(link_) {
      var regex;
      regex = new RegExp("<(\\w.+)>; rel=\"(\\w.+)\"");
      return link_.split(",").reduce(function(o, e) {
        var obj, temp, url;
        temp = e.match(regex);
        if (temp && temp.length === 3) {
          url = temp[1];
          obj = parseQuery.call(this, url);
          obj.rel = temp[2];
          obj.url = url;
          o[temp[2]] = obj;
        }
        return o;
      }, {});
    };

    parseQuery = function(url) {
      var query;
      query = url.split("?")[1];
      if (query) {
        return query.split("&").reduce(function(o, e) {
          var key, temp, value;
          temp = e.split("=");
          key = temp[0].trim();
          value = temp[1].trim();
          value = isNaN(value) ? value : Number(value);
          if (o[key]) {
            o[key].push(value);
          } else {
            o[key] = [value];
          }
          return o;
        }, {});
      }
      return null;
    };

    getStargazersAndForks = function(items_) {
      var reqs, res;
      reqs = items_.map(function(e) {
        return {
          url: "https://gist.github.com/" + e.owner.login + "/" + e.id + "/stargazers",
          muteHttpExceptions: true
        };
      });
      res = UrlFetchApp.fetchAll(reqs);
      res.forEach(function(e, i) {
        var k, obj, results, v;
        if (e.getResponseCode() === 200) {
          obj = parseHTML.call(this, e.getContentText());
          results = [];
          for (k in obj) {
            v = obj[k];
            results.push(items_[i][k] = v);
          }
          return results;
        }
      });
      return items_;
    };

    parseHTML = function(html_) {
      var str;
      str = html_.match(/<ul class="pagehead-actions float-none">[\s\S\w]+?<\/ul>/)[0];
      r = XmlService.parse(str).getRootElement().getChildren();
      return r.reduce(function(o1, e) {
        var k, t1, t2, v;
        t1 = e.getValue().toLowerCase();
        t2 = ["star", "fork"].reduce(function(o2, f) {
          if (~t1.indexOf(f)) {
            o2[f] = Number(t1.replace(f, ""));
          }
          return o2;
        }, {});
        for (k in t2) {
          v = t2[k];
          o1[k] = v;
        }
        return o1;
      }, {});
    };

    checkDiff = function(items_, values_) {
      if (this.obj.getStarsAndForks) {
        return items_.reduce(function(ar1, e) {
          var temp;
          temp = values_.reduce(function(ar2, f) {
            if (e.id === f[0] && ((!isNaN(e.comments) && !isNaN(f[4]) && e.comments !== f[4]) || (!isNaN(e.star) && !isNaN(f[7]) && e.star !== f[7]) || (!isNaN(e.fork) && !isNaN(f[8]) && e.fork !== f[8]))) {
              ar2.push({
                description: e.description,
                html_url: e.html_url,
                comments: e.comments - f[4],
                star: e.star - f[7],
                fork: e.fork - f[8]
              });
            }
            return ar2;
          }, []);
          Array.prototype.push.apply(ar1, temp);
          return ar1;
        }, []);
      }
      return items_.reduce(function(ar1, e) {
        var temp;
        temp = values_.reduce(function(ar2, f) {
          if (e.id === f[0] && e.comments !== f[4]) {
            ar2.push({
              description: e.description,
              html_url: e.html_url,
              comments: e.comments - f[4]
            });
          }
          return ar2;
        }, []);
        Array.prototype.push.apply(ar1, temp);
        return ar1;
      }, []);
    };

    updateSheet = function(items_) {
      var checkedValues;
      this.sheet.clear();
      checkedValues = items_.map((function(_this) {
        return function(e) {
          return _this.header.map(function(f) {
            if (~f.indexOf("_at")) {
              return new Date(e[f]);
            } else {
              return e[f];
            }
          });
        };
      })(this));
      checkedValues.unshift(this.header);
      return this.sheet.getRange(1, 1, checkedValues.length, checkedValues[0].length).setValues(checkedValues);
    };

    sendNoticicationMail = function(diff_) {
      var head, mailBody;
      this.response.changedGists = diff_.length;
      head = "# Following gists were changed.\n" + "# response: " + JSON.stringify(this.response) + "\n\n";
      mailBody = "";
      if (this.obj.getStarsAndForks) {
        mailBody = diff_.reduce(function(s, e, i) {
          return s += (i + 1) + ". " + e.description + "\n  " + e.html_url + "\n  comments: " + (e.comments > 0 ? "+" : "") + e.comments + "\n  stars: " + (e.star > 0 ? "+" : "") + e.star + "\n  forks: " + (e.fork > 0 ? "+" : "") + e.fork + "\n\n";
        }, head);
      } else {
        mailBody = diff_.reduce(function(s, e, i) {
          return s += (i + 1) + ". " + e.description + "\n  " + e.html_url + "\n  comments: " + (e.comments > 0 ? "+" : "") + e.comments + "\n\n";
        }, head);
      }
      if (this.obj.email) {
        return MailApp.sendEmail({
          to: this.obj.email,
          subject: "Report from " + this.name,
          body: mailBody
        });
      } else {
        return this.response.warning = "Notification mail was not sent because of no email.";
      }
    };

    putLog = function() {
      var sheet;
      sheet = getSpreadsheet.call(this, this.logSheet);
      return sheet.appendRow([new Date(this.response.startTime), this.response.totalGists || "", this.response.changedGists || 0, this.response.executionTime, this.response.error || ""]);
    };

    return GistChecker;

  })();
  return r.GistChecker = GistChecker;
})(this);
