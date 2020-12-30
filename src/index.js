const http = require("http");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs");
const log4js = require("log4js");
const util = require("util");
const log = require("single-line-log").stdout;
// const child = require("./child");
const merge = require("./merge");

// const url = "";
const __URL = "http://192.168.0.167:10000/ubuntu-20.04-desktop-amd64.iso";
// const __URL = "http://192.168.0.167:10000/wechat_devtools_1.03.2008270_x64.exe";
// const __URL =
//   "http://gosspublic.alicdn.com/oss-browser/1.7.4/oss-browser-win32-x64.zip?spm=a2c4g.11186623.2.10.5dcc1144IcwSVV&file=oss-browser-win32-x64.zip";
// const __URL = "http://dl.2345.com/pic/2345pic_v9.3.0.8549.exe";
// const __URL = "http://mirror.lzu.edu.cn/ubuntu-releases/20.04.1/ubuntu-20.04.1-desktop-amd64.iso";
// const __URL =
//   "http://onlinedown.rbread04.cn/huajuns afe/VMware-workstation-full-16.0.0-16894299.exe";
// const __URL =
//   "http://forspeed.rbread05.cn/down/newdown/10/22/baofengjihuogonji_v17.0.rar";
// const __URL =
//   "http://nodejs.org/dist/v14.15.3/node-v14.15.3-x64.msi";

// const OUTPUT = path.join(__dirname, `output`);
const OUTPUT = path.join(path.resolve(__dirname, "../"), `output`);

const COUNT = 100;

// child_process.exec("rm -rf ./output/")

// ws://127.0.0.1:9229/f2b32d20-5996-4163-94fb-7e6b65a07e98
http
  .get(__URL, {}, (res, req) => {
    const { statusCode, headers, url } = res;
    // 2715254784   2651616
    // console.log("statusCode: ", statusCode);
    // console.log("headers: ", headers);
    // console.log("url: ", url, headers, headers.path);
    const ip = res.socket.localAddress;
    const port = res.socket.localPort;
    const _path = (res.connection._httpMessage.path || "").split("?")[0] || "";
    const _pathArr = _path.split("/");

    const filename = _pathArr[_pathArr.length - 1] || `${new Date().getTime()}`;
    console.log(
      `您的 IP 地址是 ${ip}，源端口是 ${port}, filename: ${filename}`
    );
    // return;

    // headers.path
    // console.log(util.inspect(res, { showHidden: false, depth: null }));

    let chunks = [];
    let size = 0;

    const Len = headers["content-length"];
    const ifRange = headers["etag"] || headers["last-modified"];

    if (statusCode === 200) {
      // 144500
      // Len = bytes = 147964152

      const _gap = Math.floor(Len / COUNT);
      const lenStarts = [];
      const lenEnds = [];
      const paramsList = [];

      console.log(Len, _gap, Math.floor(_gap));

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
          url: __URL,
          lenMAX: Len,
          lenStart,
          lenEnd,
          OUTPUT,
          filename,
          targetPath: path.join(OUTPUT, `${filename}.${_range}`),
          // headers
          // "If-Range":
          ifRange: ifRange,
        };

        executeCountLen++;

        paramsList.push(params);

        // console.log("params", params);
        // child(params);

        const child = child_process.fork(
          `./src/child.js`,
          [],
          {}
          // (error, stdout, stderr) => {
          //   console.log(error, stdout, stderr);
          //   if (error) {
          //     throw error;
          //   }
          //   console.log(stdout);
          // }
        );

        child.on("message", (message) => {
          if (message.type === "CB") {
            cb();
          }
        });
        child.send(params);
      }

      function cb() {
        executeCount++;

        console.log(`Total Progress ${executeCount}/${executeCountLen}`);
        if (executeCount === executeCountLen) {
          console.log("success");

          merge({
            filename,
            // OUTPUT:
            output: path.join(OUTPUT, filename),
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

    // return;

    // res.on("data", (chunk) => {
    //   // console.log("chunk", chunk);
    //   size += chunk.length;

    //   chunks.push(chunk);
    //   const cmdText = `Progress ---${size}/${Len} \n`;
    //   log(cmdText);

    //   // console.log(`Progress ---${size}/${Len}`);

    //   // Do nothing
    // });
    // res.on("end", () => {
    //   try {
    //     const buf = Buffer.concat(chunks, size);

    //     // console.log(buf.toString());
    //     fs.writeFile(path.join(OUTPUT, filename), buf, {}, (res) => {
    //       console.log(res);
    //     });
    //   } catch (error) {
    //     console.error("end-error", error);
    //   }
    // });
  })
  .on("error", (error) => {
    console.log("http on error", error.code);
  });
