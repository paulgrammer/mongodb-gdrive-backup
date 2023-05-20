# MongoDB GDrive Backup

This library provides a simple yet effective way to backup your MongoDB database to Google Drive. It uses a service that triggers backups either manually or automatically according to a set cron schedule. The backup files are then uploaded to a Google Drive folder of your choice.

## Installation

To install the `mongodb-gdrive-backup` library, use npm:

```bash
npm install mongodb-gdrive-backup
```

## Usage

First, import the BackupService from `mongodb-gdrive-backup`.

```javascript
const BackupService = require("mongodb-gdrive-backup");
```

Then, initialize the service with your MongoDB URI, Google Drive authentication configuration, and backup parameters.

```javascript
let service = new BackupService({
  uri: "mongodb://localhost/db",
  drive: {
    auth: {
      /* google service account configuration here */
    },
    folder: "shared folder here",
    keep: 5 /* number of backups to hold behind */,
  },
  auto: {
    cron: "00 00 00 * * *" /* https://crontab.cronhub.io/ */,
    timezone: "Africa/Nairobi",
  },
});
```

The `mongodb-gdrive-backup` library also emits events when backups and restores are made.

```javascript
service.on("backup", (name, id) => {});
service.on("restore", (name, id) => {});
```

To trigger a backup and restore manually, use the `.backup()` and `.restore()` methods respectively.

```javascript
// Backup and restore to local disk
service.backup({ saveTo: "./test.zip" }).then(() => {
  service.restore({ backupPath: "./test.zip" }).then(() => {});
});

// Backup and restore to Google Drive
service.backup({ backupName: "test.zip" }).then(() => {
  service.restore({ backupName: "test.zip" }).then(() => {});
});
```

## Parameters

- `uri`: The MongoDB connection string.

- `drive`:
  - `auth`: Google Drive authentication object for the service account.
  - `folder`: ID of the Google Drive folder to save the backup to.
  - `keep`: Number of backup files to keep. Old backups will be deleted.

- `auto`: 
  - `cron`: Cron syntax for scheduling automatic backups. You can use this [online tool](https://crontab.cronhub.io/) to generate a cron string.
  - `timezone`: The timezone to use when interpreting the cron schedule.

## Events

- `backup`: Emitted when a backup is successfully created. Passes the backup name and ID.
- `restore`: Emitted when a backup is successfully restored. Passes the backup name and ID.

## Methods

- `.backup({ saveTo: 'path' })`: Creates a backup and saves it to the given local path or Google Drive (if `saveTo` is omitted).
- `.restore({ backupPath: 'path' })`: Restores a backup from the given local path or Google Drive (if `backupPath` is omitted).
