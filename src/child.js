const http = require("http");
const path = require("path");
const fs = require("fs");
const slog = require("single-line-log").stdout;

const OUTPUT = path.join(path.resolve(__dirname, "../"), `output`);

async function child(opttions) {
  const { url, lenMAX, lenStart, lenEnd, ifRange } = opttions;

  const _range = `${lenStart}-${lenEnd}`;
  const Range = `bytes=${_range}`;

  console.log("Range", Range);

  // ws://127.0.0.1:9229/f2b32d20-5996-4163-94fb-7e6b65a07e98
  return await http
    .get(
      url,
      {
        headers: {
          // Range: "bytes=0-144500",
          Range: Range,
          // :用于判断实体是否发生改变，如果实体未改变，服务器发送客户端丢失的部分，否则发送整个实体.
          // 使用 Etag 或者Last-Modified 返回的值
          // 如果请求报文中的 Etag与服务器目标内容的 Etag相等，即没有发生变化，那么应答报文的状态码为 206。
          // 如果服务器目标内容发生了变化，那么应答报文的状态码为 200。

          "If-Range": ifRange,
        },
      },
      (res) => {
        const { statusCode, headers, url } = res;
        // 2715254784   2651616
        // console.log("statusCode: ", statusCode);
        // console.log("headers: ", headers);
        // console.log("url: ", url, headers, headers.path);
        // const ip = res.socket.localAddress;
        // const port = res.socket.localPort;
        const filename = res.connection._httpMessage.path;
        // console.log(
        //   `您的 IP 地址是 ${ip}，源端口是 ${port}, filename: ${filename}`
        // );

        let chunks = [];
        let size = 0;

        const Len = headers["content-length"];

        if (statusCode === 200) {
          // Len;
          // 开启子进程
          // res.resume();
          // res.destroy();
        }
        // return;

        res.on("data", (chunk) => {
          // console.log("chunk", chunk);
          size += chunk.length;

          chunks.push(chunk);

          const cmdText = `Progress ---  ${size}/${Len} \n`;
          slog(cmdText);
          // console.log(cmdText);

          // Do nothing
        });

        res.on("end", () => {
          try {
            const buf = Buffer.concat(chunks, size);

            // console.log(buf.toString());
            const _path = path.join(OUTPUT, `${_range}.${filename.substr(1)}`);

            if (!fs.existsSync(OUTPUT)) {
              console.log(`${OUTPUT} does not exist, creating`);
              fs.mkdir(OUTPUT, (error) => {
                if (error !== null) {
                  return console.log(`mkdir ${OUTPUT} failing`, error);
                }

                console.log(`mkdir ${OUTPUT} success`);
              });
            }
            fs.writeFile(_path, buf, {}, (error) => {
              if (error !== null) {
                return console.log(`write ${_path} failing`, error);
              }
              console.log(`writeFile success ${_path}`);
            });
          } catch (error) {
            console.error("end-error", error);
          }
        });
      }
    )
    .on("error", (error) => {
      console.log("http on error", error.code);
    });
}

module.exports = child;
