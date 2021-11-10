# mongodb-gdrive-backup

```javascript
const BackupService = require("mongodb-gdrive-backup");

let service = new BackupService({
  uri: "mongodb://localhost/db",
  drive: {
    auth: {
      /* google service account configuration here*/
    },
    folder: "shared folder here",
    keep: 5 /* number of backups to hold behind */,
  },
  auto: {
    cron: "00 00 00 * * *" /* https://crontab.cronhub.io/ */,
    timezone: "Africa/Nairobi",
  },
});

service.on("backup", (name, id) => {});
service.on("restore", (name, id) => {});

// local disk
service.backup({ saveTo: "./test.zip" }).then(() => {
  service.restore({ backupPath: "./test.zip" }).then(() => {});
});

// google drive
service.backup({ backupName: "test.zip" }).then(() => {
  service.restore({ backupName: "test.zip" }).then(() => {});
});
```
