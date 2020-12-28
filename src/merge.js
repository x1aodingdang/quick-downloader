const { constants } = require("buffer");
const fs = require("fs");

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
  fileList.forEach((v, i) => {
    fs.readFile(v.targetPath, (err, data) => {
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
    });
  });
};
