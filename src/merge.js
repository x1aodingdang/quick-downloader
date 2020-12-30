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

  let chunks = [];
  let size = 0;
  let count = 0;
  const fileListLen = fileList.length;

  const _fileListPath = [...fileList].map((v) => {
    return v.targetPath;
  });

  const fileWriteStream = fs.createWriteStream(output); // 创建一个可写流

  fileWriteStream.on("close", (e) => {
    console.log("merge success", size, lenMAX);
    console.timeEnd("multithreading");

    fileWriteStream.end();
    fileWriteStream.destroy();
  });

  mergeStream(_fileListPath, fileWriteStream);

  return;
  fileList.forEach((v, i) => {
    const currentReadStream = fs.createReadStream(v.targetPath); // 获取当前的可读流
    currentReadStream.on("end", function () {
      console.log(i, `读完了`);
      count++;

      // streamMergeRecursive(scripts, fileWriteStream);
    });

    currentReadStream.pipe(fileWriteStream, { end: false });

    currentReadStream.on("error", function (error) {
      // 监听错误事件，关闭可写流，防止内存泄漏
      console.error("11error", error);
      // fileWriteStream.close();
    });

    // if (count === fileListLen - 1 && String(size) === lenMAX) {
    if (count === fileListLen - 1) {
      console.log("merge success", size, lenMAX);
      console.log(size);
      console.timeEnd("multithreading");

      // const buf = Buffer.concat(chunks, size);

      // fs.writeFile(output, buf, (err, data) => {
      //   if (err) throw err;

      //   console.log(`writeFile success ${output}`);
      //   console.log(`download success !`);
      // fileWriteStream.end("console.log('Stream 合并完成')");
      fileWriteStream.close();
      fileWriteStream.end();
      fileWriteStream.destroy();
      // });
    }

    /*  fs.readFile(v.targetPath, (err, data) => {
      if (err) throw err;

      chunks[i] = data;
      size += data.length;
      // console.log(data);
      if (count === fileListLen - 1 && String(size) === lenMAX) {
        console.log("merge success", size, lenMAX);
        console.log(size);
        const buf = Buffer.concat(chunks, size);

        fs.writeFile(output, buf, (err, data) => {
          if (err) throw err;

          console.log(`writeFile success ${output}`);
          console.log(`download success !`);
          console.timeEnd("multithreading");
        });
      }
      count++;
    }); */
    /* fs.readFile(v.targetPath, 
      (err, data) => {
      if (err) throw err;

      chunks[i] = data;
      size += data.length;
      // console.log(data);
      if (count === fileListLen - 1 && String(size) === lenMAX) {
        console.log("merge success", size, lenMAX);
        console.log(size);
        // const buf = Buffer.concat(chunks, size);

        // fs.writeFile(output, buf, (err, data) => {
        //   if (err) throw err;

        //   console.log(`writeFile success ${output}`);
        //   console.log(`download success !`);
        console.timeEnd("multithreading");
        // });
      }
    }
    ); */
    // const data = fs.readFileSync(v.targetPath);

    // fs.appendFileSync(output, data);
  });
};
