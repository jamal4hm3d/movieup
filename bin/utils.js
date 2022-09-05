import fetch from "node-fetch";
import tokens from "./tokens.js";

async function getData(name, id) {
  const req = await fetch(`https://api.github.com/gists/${id}`);
  const gist = await req.json();
  return JSON.parse(gist.files[name].content);
}

async function setData(data, name, id) {
  const req = await fetch(`https://api.github.com/gists/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${tokens.pat}`,
    },
    body: JSON.stringify({
      files: {
        [name]: {
          content: JSON.stringify(data),
        },
      },
    }),
  });
}

function getEmptyAcc(accounts) {
  for (const acc in accounts) {
    if (accounts[acc].isEmpty) {
      return acc;
    }
  }
}

function getNotEmptyAcc(accounts) {
  for (const acc in accounts) {
    if (!accounts[acc].isEmpty) {
      return acc;
    }
  }
}

function getStr(name) {
  return `"${name}"`;
}

function getLinkFromOut(str) {
  const strList = str.split(" ");
  const linkL = strList.find((s) => s.startsWith("https://"));
  const linkR = linkL.split("\n")[0];
  return linkR.split("\r")[0];
}

let utils = {
  getData,
  setData,
  getEmptyAcc,
  getNotEmptyAcc,
  getStr,
  getLinkFromOut,
};

export default utils;
