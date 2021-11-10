const Router = require("./router");
const { CronJob } = require("cron");
const DriveService = require("./google-drive");
const xtend = require("xtend");
const moment = require("moment");
const { restoreFromZip, backupToZip } = require("./utils");
const defaultConfig = require("./config.default");
const { PassThrough } = require("stream");
const EventEmitter = require("events");
const os = require("os");
const path = require("path");
const fs = require("fs-extra");

class Backup extends EventEmitter {
  constructor(config) {
    super();
    this.config = xtend(defaultConfig, config);
    this.driveService = new DriveService(this.config.drive.auth);

    if (this.config.auto.cron) {
      this.auto();
    }
  }

  get router() {
    return Router(this.driveService);
  }

  auto() {
    let cron = new CronJob(
      this.config.auto.cron,
      () => this.backup({ auto: true }),
      null,
      true,
      this.config.auto.timezone
    );

    cron.start();
  }

  async backup({
    saveTo,
    backupName = `${moment().format("DD-MM-YYYY")}.zip`,
    auto,
    toBuffer,
  } = {}) {
    const streamBuffer = await backupToZip({
      uri: this.config.uri,
      saveTo,
    });

    if (toBuffer) return streamBuffer;

    if (!saveTo) {
      if (auto) {
        let backups = await this.driveService.listFolder(
          this.config.drive.folder
        );

        if (backups.length >= (this.config.drive.keep || 0)) {
          let lastBackup = backups[backups.length - 1];

          if (lastBackup) {
            //remove the first backup
            let dRes = await this.driveService.deleteFile(lastBackup.id);
            this.emit("delete", lastBackup, dRes.data);
          }
        }
      }

      let bufferStream = new PassThrough();
      bufferStream.end(streamBuffer);

      let upRes = await this.driveService.upload({
        folder: this.config.drive.folder,
        fileName: backupName,
        mimeType: "application/zip",
        body: bufferStream,
      });

      this.emit("backup", backupName, upRes.data.id);
    }

    return streamBuffer;
  }

  async restore({ backupName, id, backupPath, drop }) {
    if (backupName || id) {
      return new Promise(async (resolve, reject) => {
        let backups = await this.driveService.listFolder(
          this.config.drive.folder
        );

        let backup = backups.find(
          (backup) => backup.name === backupName || backup.id === id
        );

        if (backup) {
          backupPath = path.resolve(os.tmpdir(), backup.name);
          let stream = await this.driveService.getFileStream(backup.id);
          var dest = fs.createWriteStream(backupPath);

          stream.on("end", () => {
            this.restoreFromPath(backupPath, drop)
              .then(() => {
                fs.removeSync(backupPath);
                this.emit("restore", backup.name, backup.id);
                resolve();
              })
              .catch(reject);
          });

          stream.pipe(dest);
        } else {
          reject(new Error("No backup found"));
        }
      });
    } else {
      return this.restoreFromPath(backupPath, drop);
    }
  }

  restoreFromPath(backupPath, drop = false) {
    return restoreFromZip(backupPath, {
      drop,
      uri: this.config.uri,
    });
  }
}

module.exports = Backup;
