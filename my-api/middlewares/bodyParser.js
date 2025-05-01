const express = require("express");

// Middleware untuk mem-parsing JSON di body request
const jsonMiddleware = express.json();

module.exports = jsonMiddleware;
