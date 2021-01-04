const http = require("http");
const path = require("path");
const fs = require("fs");

// const OUTPUT = path.join(path.resolve(__dirname, "../"), `output`);

process.on("message", (params) => {
  // console.log(`CHILD got message: ${params.index}`);
  if (params.type === "RUN") {
    child(params);
  }
});

async function child(opttions) {
  const {
    index,
    url,
    lenMAX,
    lenStart,
    lenEnd,
    ifRange,
    cb,
    OUTPUT,
    targetPath,
  } = opttions;

  const _range = `${lenStart}-${lenEnd}`;
  const Range = `bytes=${_range}`;

  // console.log("Range", Range);

  // console.log("Range", Range);

  http
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

          // const cmdText = `Progress ---  ${size}/${Len} \n`;
          // slog(cmdText);

          process.send({
            type: "DOWNLOADING",
            current: size,
            total: Len,
            index,
          });
        });

        res.on("end", () => {
          try {
            const buf = Buffer.concat(chunks, size);

            // console.log(buf.toString());
            // const _path = path.join(OUTPUT, `${_range}.${filename.substr(1)}`);
            // const _path = path.join(OUTPUT, `${filename}.${_range}`);

            if (!fs.existsSync(OUTPUT)) {
              console.log(`${OUTPUT} does not exist, creating`);
              fs.mkdir(OUTPUT, (error) => {
                if (error !== null) {
                  return console.log(`mkdir ${OUTPUT} failing`, error);
                }

                console.log(`mkdir ${OUTPUT} success`);
              });
            }
            fs.writeFile(targetPath, buf, {}, (error) => {
              if (error !== null) {
                return console.log(`write ${targetPath} failing`, error);
              }
              console.log(`writeFile success ${targetPath}`);
              process.send({
                type: "CB",
              });
              process.exit();
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
