const http = require("http");
const https = require("https");

module.exports.request = function (url = "") {
  switch (true) {
    case url.substr(0, 5) === "https":
      return https;
      break;
    case url.substr(0, 4) === "http":
      return http;
      break;

    default:
      throw `url error : ${url}`;
  }
};
