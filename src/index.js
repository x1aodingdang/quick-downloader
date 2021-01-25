const { request } = require("./utils");
const path = require("path");
const child_process = require("child_process");
const slog = require("single-line-log").stdout;
const merge = require("./merge");
const os = require("os");

// const __URL = "http://downloads.prepros.io/v7/Prepros-Setup-7.3.29.exe";
// const __URL = "http://v2.googlehelper.net/src/Ghelper2.2.1.all.zip";
// const __URL = "http://192.168.0.167:10000/ubuntu-20.04-desktop-amd64.iso";
const __URL = "http://192.168.0.167:10000/wechat_devtools_1.03.2008270_x64.exe";
// const __URL = "http://akamaicdn.webex.com/client/webexapp.msi";
// const __URL = "http://file.foxitreader.cn/file/Channel/edit/FoxitInst-R2.exe";
// const __URL =
//   "http://gosspublic.alicdn.com/oss-browser/1.7.4/oss-browser-win32-x64.zip?spm=a2c4g.11186623.2.10.5dcc1144IcwSVV&file=oss-browser-win32-x64.zip";
// const __URL = "http://dl.2345.com/pic/2345pic_v9.3.0.8549.exe";
// const __URL = "http://mirror.lzu.edu.cn/ubuntu-releases/20.04.1/ubuntu-20.04.1-desktop-amd64.iso";
// const __URL =
//   "http://onlinedown.rbread04.cn/huajunsafe/VMware-workstation-full-16.0.0-16894299.exe";
// const __URL =
//   "https://raw.githubusercontent.com/Ionzzz/Daily/fb9e3c0c83b3d75f769cf5849a852e14cc43327b/%E6%86%A8%E6%89%B9/%E4%BB%B7%E5%80%BC-%E5%BC%A0%E7%A3%8A.pdf";
// const __URL =
//   "http://nodejs.org/dist/v14.15.3/node-v14.15.3-x64.msi";

// const OUTPUT = path.join(path.resolve(__dirname, "../"), `output`);
const OUTPUT = os.tmpdir();

const COUNT = os.cpus().length - 1;

// main({
//   url: __URL,
// });

/**
 *
 *
 * @param {Object} options {
 *
 *  @param {String} url 下载地址 必填
 *  @param {String} output 输出路径 默认为系统临时路径
 *  @param {Number} workerCount 线程数量 默认为 os.cpus().length - 1
 *
 * }
 */
function main(options) {
  // child_process.exec("rm -rf ./output/")

  const { url, output = OUTPUT, workerCount = COUNT } = options;

  if (!url) {
    throw "ERROR: URL is empty";
  }

  request(url)
    .get(url, {}, (res, req) => {
      const { statusCode, headers, url: ResUrl } = res;

      const ip = res.socket.localAddress;
      const port = res.socket.localPort;
      const _path =
        (res.connection._httpMessage.path || "").split("?")[0] || "";
      const _pathArr = _path.split("/");

      const filename =
        _pathArr[_pathArr.length - 1] || `${new Date().getTime()}`;
      console.log(
        `您的 IP 地址是 ${ip}，源端口是 ${port}, filename: ${filename}`
      );

      // headers.path

      const Len = headers["content-length"];
      const ifRange = headers["etag"] || headers["last-modified"];

      if (statusCode === 200) {
        const _gap = Math.floor(Len / workerCount);
        const lenStarts = [];
        const lenEnds = [];
        const paramsList = [];
        let totalProgress = [];
        let timeId = null;

        timeId = setInterval(() => {
          const current = totalProgress.reduce((val, next) => {
            return val + next;
          });
          const s_h = ((current / Len) * 100).toFixed(2);
          const cmdText = `Progress ---  ${s_h}% \n`;
          // current: size, total: Len,
          slog(cmdText);
        }, 1000);

        let executeCount = 0;
        let executeCountLen = 0;

        console.time("multithreading");

        for (let index = 0; index < Len; index += _gap) {
          const lenStart = index === 0 ? index : index + 1;
          const lenEnd = Math.min(index + _gap, Len);
          lenStarts.push(lenStart);
          lenEnds.push(lenEnd);

          const _range = `${lenStart}-${lenEnd}`;

          const params = {
            type: "RUN",
            index: executeCountLen,
            url: url,
            lenMAX: Len,
            lenStart,
            lenEnd,
            OUTPUT: output,
            filename,
            targetPath: path.join(output, `${filename}.${_range}`),
            // headers
            // "If-Range":
            ifRange: ifRange,
          };

          executeCountLen++;

          paramsList.push(params);

          // console.log("params", params);
          // child(params);

          const child = child_process.fork(`./child.js`, [], {});

          child.on("message", (message) => {
            switch (message.type) {
              case "CB":
                cb();
                break;
              case "DOWNLOADING":
                totalProgress[message.index] = message.current;

                break;
            }
          });
          child.send(params);
        }

        function cb() {
          executeCount++;

          console.log(`Total Progress ${executeCount}/${executeCountLen}`);
          if (executeCount === executeCountLen) {
            console.log("success");

            clearInterval(timeId);

            merge({
              filename,
              // OUTPUT:
              output: path.join(output, filename),
              lenMAX: Len,
              fileList: paramsList.map((v) => {
                return {
                  targetPath: v.targetPath,
                };
              }),
            });

            return;
          }
        }

        // console.log("lenStarts,", lenStarts);
        // console.log("lenEnds,", lenEnds);

        // Len;
        // 开启子进程
        res.resume();
        res.destroy();
      } else {
        console.log("statusCode", statusCode);
      }
    })
    .on("error", (error) => {
      console.log("http on error", error.code);
    });
}

module.exports = main;
