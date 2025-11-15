var mysql = require("mysql");

var connection = mysql.createConnection({
  host: "localhost",
  database: "MovieCommunity",
  user: "root",
  password: "12345678",
  multipleStatements: true,
});

module.exports = connection;