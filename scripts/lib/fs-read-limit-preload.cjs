// NODE_OPTIONS="--require <repo>/scripts/lib/fs-read-limit-preload.cjs" — local Windows builds only (see fs-read-limit.cjs).
"use strict";
const { installReadLimit } = require("./fs-read-limit.cjs");

installReadLimit(require("fs").promises, Number(process.env.LFT_FS_READ_LIMIT || 1024));
