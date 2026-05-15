const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const mysql = require("mysql2");
const app = express();
console.log(__dirname);

const dbConn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "L!rg2x!220X75WM",
  database: "greatrift",
});

app.use(session({
  secret: "vegetables",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 800 },
}),
);

app.use(express.static("public")); // direct server to redirect any statci files(js,css,images) requests to the public folder
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index.ejs");
});
app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/login", (req, res) => {
  // recievedlogin data - username,password,remember me
  const { username, password, remember } = req.body;
  dbConn.query(
    `SELECT * FROM admin_users WHERE username = "${username}"`,
    (err, results) => {
      // check for mysql connection of sql statements errors
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Internal Server Error");
      }
      // if there are no errors - then check if the username exists in the database - data matching the username provided in the login form
      console.log(results);
      if (results.length === 0) {
        return res.status(401).send("Invalid username or password");
      }
      // if the username exists - then check if the password provided in the login form matches the password hash stored in the database for that user
      const user = results[0];
      if (bcrypt.compareSync(password, user.password_hash)) {
        // use hashed passwords and a secure comparison method - bcrypt
        res.send("Login successful");
      } else {
        res.status(401).send("Invalid username or password");
      }
    },
  );
})

// Private Routes - only accessible to authenticated users
app.get("/dashboard", (req, res) => {
  if (req.session && req.session.user) {
    res.send(`Welcome to the dashboard, ${req.session.user.username}!`);
  }
  else {
    res.status(401).send("Not allowed / Unauthorized");
  }
});

app.get("/register/admin", (req, res) => {
  if (req.session && req.session.user) {
    res.render("registeradmin.ejs");
  } else {
    res.status(401).send("Not Allowed / Unauthorized ");
  }
});

app.get("/register/driver", (req, res) => {
  if (req.session && req.session.user) {
    res.render("registerdriver.ejs");
  } else {
    res.status(401).send("Not Allowed / Unauthorized ");
  }
});

app.get("/admin", (req, res) => {
  res.render("admindashboard.ejs");
});

app.get("/driver", (req, res) => {
  res.render("driverdashboard.ejs");
});

app.get("/trips", (req, res) => {
  if (req.session && req.session.user) {
    res.render("trips-manage.ejs");
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/bookings", (req, res) => {
  if (req.session && req.session.user) {
    res.render("bookings-manage.ejs");
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/routes", (req, res) => {
  if (req.session && req.session.user) {
    res.render("routes-browse.ejs");
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/payments", (req, res) => {
  if (req.session && req.session.user) {
    res.render("payments-manage.ejs");
  } else {
    res.status(401).redirect("/login");
  }
});

//start the app
app.listen(3001, () => console.log("Server running on PORT 3001"));

