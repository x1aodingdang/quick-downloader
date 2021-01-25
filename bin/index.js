#!/usr/bin/env node

const fs = require("fs");
const { Command } = require("commander");
const package = require("./package.json");
const main = require("../src/index");

const program = new Command();

const params = {
  url: undefined,
  output: undefined,
  workerCount: undefined,
};

const checkUrl = (url) => {
  const reg = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
  return reg.test(url);
};
//
program
  .name("qd")
  .version(package.version)

  .arguments("<url>")

  .description("command", {
    url: "download link",
  })

  /***
   * output 输出目录
   *
   ***/
  .option(
    "-o, --output <string>",
    "output directory",
    function (value, dummyPrevious) {
      if (value) {
        if (!fs.existsSync) {
          fs.mkdir(value);
        }
        return value;
      }
      return false;
      // console.log(value, dummyPrevious);
    }
  )

  /***
   * workerCount 线程数量
   *
   ***/
  .option(
    "-w, --workerCount <number>",
    "output directory",
    function (value, dummyPrevious) {
      if (value) {
        return Number(value);
      }
      return false;
      // console.log(value, dummyPrevious);
    }
  )

  /***
   * url 下载资源地址
   *
   ***/
  .action((url, options, command) => {
    if (!checkUrl(url)) {
      throw "ERROR: Please enter the URL";
    }
    params.url = url;
    if (url.indexOf("://") === -1) {
      params.url = `http://${url}`;
    }
    if (options.output) {
      params.output = options.output;
    }
    if (options.workerCount) {
      params.workerCount = options.workerCount;
    }

    main(params);
  });
// .command("qd <url>", "download link");

program.parse(process.argv);

// console.log(program);

// program.exitOverride();

// try {
//   program.parse(process.argv);
// } catch (err) {
//   console.log(err);
//   // 自定义处理...
//   // console.log(err);
// }
