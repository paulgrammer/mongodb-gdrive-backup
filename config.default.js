module.exports = Object.freeze({
  uri: "mongodb://localhost/db",
  drive: {
    auth: {
      /* google service account configuration here*/
    },
    folder: "shared folder here",
    keep: 1,
  },
  auto: {
    cron: "00 00 00 * * *", // https://crontab.cronhub.io/
    timezone: "Africa/Nairobi",
  },
});
