#!/usr/bin/env node

import tokens from "./tokens.js";
import utils from "./utils.js";
import { File, Storage } from "megajs";
import { createSpinner } from "nanospinner";
import path from "path";
import { execa } from "execa";

const today = new Date().getDate();

const movieAccounts = await utils.getData(
  "movie-accounts.json",
  tokens.movieAccount
);

const movies = await utils.getData("movies.json", tokens.movies);

const emptyAcc = utils.getEmptyAcc(movieAccounts.accounts);

const notEmptyAcc = utils.getNotEmptyAcc(movieAccounts.accounts);

const fileLinks = {};

let newLink;

const uploadArg = process.argv[2];

const id = process.argv[3];

if (uploadArg) {
  if (uploadArg.startsWith("https://mega")) {
    const uploadProcess = execa(
      "megauploadlink",
      [
        emptyAcc,
        tokens.password,
        utils.getStr(uploadArg),
        utils.getStr(movieAccounts.link),
      ],
      { shell: true, all: true }
    );
    uploadProcess.all.pipe(process.stdout);
    const { all: uploadData } = await uploadProcess;
    newLink = utils.getLinkFromOut(uploadData);
  } else {
    const filePath = path.resolve(uploadArg);
    const uploadProcess = execa(
      "megauploadfile",
      [
        emptyAcc,
        tokens.password,
        utils.getStr(filePath),
        utils.getStr(movieAccounts.link),
      ],
      { shell: true, all: true }
    );
    uploadProcess.all.pipe(process.stdout);
    const { all: uploadData } = await uploadProcess;
    newLink = utils.getLinkFromOut(uploadData);
  }
} else {
  console.log("give link or file");
  process.exit(1);
}

const deleteSpinner = createSpinner(`Deleting files from ${notEmptyAcc}`);

const storage = await new Storage({
  email: notEmptyAcc,
  password: tokens.password,
  userAgent: "Mozilla/5.0",
  keepalive: false,
}).ready;

const oldFile = storage.root.children[0];

await oldFile.delete(true);

deleteSpinner.success();

const fileLinkspinner = createSpinner("Getting filelinks...").start();

const filesFolder = File.fromURL(newLink);

const filesFolderWithAttr = await filesFolder.loadAttributes();

for (const file of filesFolderWithAttr.children) {
  const id = await file.downloadId;
  fileLinks[file.name.slice(0, -4)] = `${newLink}/file/${id[1]}`;
}

const newMovie = Object.keys(fileLinks).filter(
  (x) => !Object.keys(movies).includes(x)
);

for (const movie in movies) {
  movies[movie].link = fileLinks[movie];
}

const newMovieData = {};

newMovieData.link = fileLinks[newMovie[0]];

newMovieData.id = id;

movies[newMovie[0]] = newMovieData;

fileLinkspinner.success();

const sendingDbSpinner = createSpinner("Sending data to Database...").start();

await utils.setData(movies, "movies.json", tokens.movies);

const accounts = {};

accounts[emptyAcc] = { isEmpty: false };
accounts[notEmptyAcc] = { isEmpty: true };

const newData = { accounts };

newData.link = newLink;

newData.date = today;

await utils.setData(newData, "movie-accounts.json", tokens.movieAccount);

sendingDbSpinner.success();
