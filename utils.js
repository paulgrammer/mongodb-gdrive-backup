const backup = require("mongodb-backup-4x");
const restore = require("mongodb-restore");
const xtend = require("xtend");
const zipDir = require("zip-dir");
const DecompressZip = require("decompress-zip");
const os = require("os");
const path = require("path");
const uuid = require("uuid");
const fs = require("fs-extra");

function backupToZip(options) {
  return new Promise((resolve, reject) => {
    let rootDir = os.tmpdir();
    let dbStr = options.uri.split("/");
    let [database] = dbStr[dbStr.length - 1].split("?");
    let dirToZip = `${rootDir}/${database}`;

    backup(
      xtend(options, {
        root: rootDir,
        callback: function () {
          zipDir(
            dirToZip,
            xtend(options.saveTo ? { saveTo: options.saveTo } : {}),
            function (err, buffer) {
              if (err) return reject(err);
              fs.removeSync(dirToZip);
              resolve(buffer);
            }
          );
        },
      })
    );
  });
}

function restoreFromZip(zipFile, options) {
  return new Promise((resolve, reject) => {
    const unzipper = new DecompressZip(zipFile);
    let tmpDir = path.join(os.tmpdir(), uuid.v4());

    unzipper.on("error", reject);

    unzipper.on("extract", function () {
      restore(
        xtend(options, {
          root: tmpDir,
          callback: () => {
            fs.removeSync(tmpDir);
            resolve();
          },
        })
      );
    });

    return unzipper.extract({
      path: tmpDir,
    });
  });
}

module.exports = { restoreFromZip, backupToZip };
