const fs = require("fs");

function mergeStream(fileList = [], fw) {
  if (!fileList.length) {
    return fw.end("console.log('Stream 合并完成')");
  }
  const originPath = fileList.shift();

  const curFr = fs.createReadStream(originPath);

  curFr.pipe(fw, { end: false });

  curFr.on("end", (e) => {
    console.log(`数据读取完毕 originPath =>`, originPath);

    mergeStream(fileList, fw);
  });
}

module.exports = function (options) {
  const {
    filename, // 原名称
    fileList,
    lenMAX,
    output,
  } = options;

  let size = 0;

  const _fileListPath = [...fileList].map((v) => {
    return v.targetPath;
  });

  if (!fs.existsSync(output)) {
    fs.mkdirSync(output);
  }

  const fileWriteStream = fs.createWriteStream(output); // 创建一个可写流

  fileWriteStream.on("close", (e) => {
    console.log("merge success", size, lenMAX);
    console.timeEnd("multithreading");

    fileWriteStream.end();
    fileWriteStream.destroy();
  });

  mergeStream(_fileListPath, fileWriteStream);
};
