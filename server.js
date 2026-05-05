const express = require("express");
const path = require("path");
const app = express();
console.log(__dirname);

app.use(express.static("public")); // direct server to redirect any statci files(js,css,images) requests to the public folder

app.get("/", (req, res) => {
  res.render("index.ejs");
});
app.get("/about", (req, res) => {
  res.render("about.ejs");
});
app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});
app.get("/admin", (req, res) => {
  res.render("admindashboard.ejs");
});
app.get("/driver", (req, res) => {
  res.render("driverdashboard.ejs");
});
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.get("/register/admin", (req, res) => {
  res.render("registeradmin.ejs");
});
app.get("/register/driver", (req, res) => {
  res.render("registerdriver.ejs");
});
// get routes are for loading pages

//start the app
app.listen(3001, () => console.log("Server running on PORT 3001"));
