const multer = require("multer");
const express = require("express");
const router = express.Router();
const uuid = require("uuid");
const fs = require("fs-extra");

module.exports = (backupService) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, os.tmpdir());
      },
      filename: (req, file, cb) => {
        let splitted = file.originalname.split(".");
        cb(null, `${uuid.v4()}.${splitted[splitted.length - 1]}`);
      },
    }),
  }).single("backup");

  const multerMiddleWare = function (req, res, next) {
    upload(req, res, function (err) {
      if (err) {
        return next(new Error(err.message));
      }
      next();
    });
  };

  router
    .route("/")
    .get((req, res, next) => {
      backupService
        .backup({ toBuffer: true })
        .then((buffer) => {
          res.contentType("application/zip");
          res.send(buffer);
        })
        .catch((err) => next(err));
    })
    .post(multerMiddleWare, (req, res, next) => {
      backupService
        .restoreFromPath(req.file.path)
        .then(() => {
          fs.removeSync(req.file.path);
          res.json({ success: true });
        })
        .catch((err) => next(err));
    })
    .put((req, res, next) => {
      let { date } = req.body;
      backupService
        .restore({ name: date })
        .then(() => res.json({ success: true }))
        .catch((err) => next(err));
    });

  return router;
};
