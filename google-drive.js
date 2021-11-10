const { google } = require("googleapis");
const { GoogleAuth } = require("google-auth-library");
const getList = require("google-drive-getfilelist");

function DriveService(config) {
  let auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  this.auth = auth.fromJSON(config);

  this.driveService = google.drive({
    version: "v3",
    auth: this.auth,
  });
}

DriveService.prototype.upload = async function ({
  folder,
  fileName,
  mimeType,
  body,
}) {
  const metadata = {
    name: fileName,
    parents: [folder],
  };

  const media = {
    mimeType,
    body,
  };

  return this.driveService.files.create({
    resource: metadata,
    media,
    fields: "id",
  });
};

DriveService.prototype.getFileStream = async function (fileId) {
  let { data } = await this.driveService.files.get(
    {
      fileId: fileId,
      alt: "media",
    },
    { responseType: "stream" }
  );

  return data;
};

DriveService.prototype.deleteFile = function (fileId) {
  return this.driveService.files.delete({
    fileId,
  });
};

DriveService.prototype.listFolder = function (folder) {
  return new Promise((resolve, reject) => {
    getList.GetFileList(
      {
        auth: this.auth,
        fields: "files(id, name)",
        id: folder,
      },
      (err, res) => {
        if (err) {
          return reject(err);
        }
        const fileList = res.fileList.flatMap(({ files }) => files);
        resolve(fileList);
      }
    );
  });
};

module.exports = DriveService;
