const http = require("http");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs");
const log4js = require("log4js");
const util = require("util");
const log = require("single-line-log").stdout;
const child = require("./child");

// const len = 100000;
// for (let index = 0; index < len; index++) {
//   // console.log(index);
//   let cmdText = `Progress ---${index}/${len}`;
//   log(cmdText);
// }

// return;
// log4js.configure({
//   appenders: { cheese: { type: "file", filename: "cheese.log" } },
//   categories: { default: { appenders: ["cheese"], level: "error" } },
// });

// const url = "";
// const url = "http://192.168.0.167:10000/ubuntu-20.04-desktop-amd64.iso";
const __URL = "http://192.168.0.167:10000/wechat_devtools_1.03.2008270_x64.exe";

const OUTPUT = path.join(__dirname, `output`);

const COUNT = 5;

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
    const filename = res.connection._httpMessage.path;
    console.log(
      `您的 IP 地址是 ${ip}，源端口是 ${port}, filename: ${filename}`
    );

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

      console.log(Len, _gap, Math.floor(_gap));

      for (let index = 0; index < Len; index += _gap) {
        const lenStart = index === 0 ? index : index + 1;
        const lenEnd = Math.min(index + _gap, Len);
        lenStarts.push(lenStart);
        lenEnds.push(lenEnd);
        const params = {
          url: __URL,
          lenMAX: Len,
          lenStart,
          lenEnd,
          // headers
          // "If-Range":
          ifRange: ifRange,
        };

        console.log("params", params);
        child(params);
      }

      console.log("lenStarts,", lenStarts);
      console.log("lenEnds,", lenEnds);

      // Len;
      // 开启子进程
      res.resume();
      res.destroy();
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
