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

app.use(
  session({
    secret: "vegetables",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 800000000 },
  }),
);

app.use(express.static("public")); // direct server to redirect any statci files(js,css,images) requests to the public folder
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

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
        // res.send("Login successful");
        req.session.user = user; // initialize session
        res.redirect("/dashboard");
      } else {
        res.status(401).send("Invalid username or password");
      }
    },
  );
});

//logout logic
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.status(304).redirect("/login");
});

// Private Routes - only accessible to authenticated users
app.get("/dashboard", (req, res) => {
  if (req.session && req.session.user) {
    res.render("dashboard.ejs");
  } else {
    res.status(401).redirect("/login");
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
    const getDriverInfo = `select driver_id, first_name, last_name, license_number from drivers`;
    const getRouteInfo = `select route_id, origin, destination from routes`;
    const getVehicleInfo = `select number_plate, model from vehicles`;
    const getAllTrips = `select * from trips`;
    dbConn.query(getDriverInfo, (d_err, driverResults) => {
      if (d_err) {
        console.error("Database error:", d_err);
        return res.status(500).send("Internal Server Error");
      }
      dbConn.query(getRouteInfo, (r_err, routeResults) => {
        if (r_err) {
          console.error("Database error:", r_err);
          return res.status(500).send("Internal Server Error");
        }
        dbConn.query(getVehicleInfo, (v_err, vehicleResults) => {
          if (v_err) {
            console.error("Database error:", v_err);
            return res.status(500).send("Internal Server Error");
          }
          dbConn.query(getAllTrips, (t_err, tripResults) => {
            if (t_err) {
              console.error("Database error:", t_err);
              return res.status(500).send("Internal Server Error");
            }
            res.render("trips-manage.ejs", {
              drivers: driverResults,
              routes: routeResults,
              vehicles: vehicleResults,
              trips: tripResults,
            });
          });
        });
      });
    });
  } else {
    res.status(401).redirect("/login");
  }
});

app.post("/add-trip", (req, res) => {
  if (req.session && req.session.user) {
    const {
      route_id,
      number_plate,
      driver_id,
      departure_time,
      arrival_time,
      status,
    } = req.body;
    const insertQuery = `INSERT INTO trips (route_id, number_plate, driver_id, departure_time, arrival_time, status) VALUES ('${route_id}','${number_plate}','${driver_id}','${departure_time}','${arrival_time}','${status}')`;

    dbConn.query(insertQuery, (err, results) => {
      if (err) {
        console.error("Error adding trip:", err);
        return res.status(500).send("Failed to add trip");
      }
      res.redirect("/trips?addSuccess=true");
    });
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/bookings", (req, res) => {
  if (req.session && req.session.user) {
    const bookingsQuery = `
      SELECT b.booking_id,
             b.trip_id,
             b.client_name,
             b.client_phone,
             b.client_email,
             b.seat_number,
             b.booking_date,
             b.payment_status,
             r.origin,
             r.destination
      FROM bookings b
      LEFT JOIN trips t ON b.trip_id = t.trip_id
      LEFT JOIN routes r ON t.route_id = r.route_id
      ORDER BY b.booking_date DESC
    `;

    dbConn.query(bookingsQuery, (err, bookings) => {
      if (err) {
        console.error("Error fetching bookings:", err);
        return res.status(500).send("Failed to fetch bookings");
      }
      res.render("bookings-manage.ejs", { bookings });
    });
  } else {
    res.status(401).redirect("/login");
  }
});

app.post("/add-booking", (req, res) => {
  if (req.session && req.session.user) {
    const {
      trip_id,
      client_name,
      client_phone,
      client_email,
      seat_number,
      payment_status,
    } = req.body;
    const insertQuery = `INSERT INTO bookings (trip_id, client_name, client_phone, client_email, seat_number, payment_status) VALUES ('${trip_id}','${client_name}','${client_phone}','${client_email}','${seat_number}','${payment_status}')`;

    dbConn.query(insertQuery, (err, results) => {
      if (err) {
        console.error("Error adding booking:", err);
        return res.status(500).send("Failed to add booking");
      }
      res.redirect("/bookings?addSuccess=true");
    });
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/routes", (req, res) => {
  if (req.session && req.session.user) {
    dbConn.query("SELECT * FROM routes", (err, routes) => {
      if (err) {
        console.error("Error fetching routes:", err);
        return res.status(500).send("Failed to fetch routes");
      }
      res.render("routes-browse.ejs", { routes });
    });
  } else {
    res.status(401).redirect("/login");
  }
});

app.post("/add-route", (req, res) => {
  if (req.session && req.session.user) {
    const { origin, destination, base_price, distance_km, estimated_duration } =
      req.body;
    const insertQuery = `INSERT INTO routes (origin, destination, base_price, distance_km, estimated_duration) VALUES ('${origin}','${destination}','${base_price}','${distance_km}','${estimated_duration}')`;

    dbConn.query(insertQuery, (err, results) => {
      if (err) {
        console.error("Error adding route:", err);
        return res.status(500).send("Failed to add route");
      }
      res.redirect("/routes?addSuccess=true");
    });
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/vehicles", (req, res) => {
  if (req.session && req.session.user) {
    dbConn.query(
      "SELECT * FROM vehicles ORDER BY number_plate ASC",
      (err, vehicles) => {
        if (err) {
          console.error("Error fetching vehicles:", err);
          return res.status(500).send("Failed to fetch vehicles");
        }
        res.render("vehicles-manage.ejs", { vehicles });
      },
    );
  } else {
    res.status(401).redirect("/login");
  }
});

app.post("/add-vehicle", (req, res) => {
  if (req.session && req.session.user) {
    const {
      number_plate,
      model,
      color,
      capacity,
      exterior_img_url,
      interior_img_url,
      status,
    } = req.body;

    const insertQuery = `INSERT INTO vehicles (number_plate, model, color, capacity, exterior_img_url, interior_img_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    dbConn.query(
      insertQuery,
      [
        number_plate,
        model,
        color,
        capacity,
        exterior_img_url,
        interior_img_url,
        status,
      ],
      (err) => {
        if (err) {
          console.error("Error adding vehicle:", err);
          return res.status(500).send("Failed to add vehicle");
        }
        res.redirect("/vehicles?addSuccess=true");
      },
    );
  } else {
    res.status(401).redirect("/login");
  }
});

app.post("/update-vehicle-status", (req, res) => {
  if (req.session && req.session.user) {
    const { number_plate, status } = req.body;
    const allowedStatus = ["active", "maintenance", "retired"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).send("Invalid vehicle status");
    }

    dbConn.query(
      "UPDATE vehicles SET status = ? WHERE number_plate = ?",
      [status, number_plate],
      (err) => {
        if (err) {
          console.error("Error updating vehicle status:", err);
          return res.status(500).send("Failed to update vehicle status");
        }
        res.redirect("/vehicles?statusUpdated=true");
      },
    );
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/drivers", (req, res) => {
  if (req.session && req.session.user) {
    dbConn.query(
      "SELECT * FROM drivers ORDER BY date_joined DESC",
      (err, drivers) => {
        if (err) {
          console.error("Error fetching drivers:", err);
          return res.status(500).send("Failed to fetch drivers");
        }
        res.render("drivers-manage.ejs", { drivers });
      },
    );
  } else {
    res.status(401).redirect("/login");
  }
});

app.post("/add-driver", (req, res) => {
  if (req.session && req.session.user) {
    const {
      first_name,
      last_name,
      id_number,
      phone_number,
      license_number,
      license_expiry_date,
      status,
    } = req.body;

    const insertQuery = `INSERT INTO drivers (first_name, last_name, id_number, phone_number, license_number, license_expiry_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    dbConn.query(
      insertQuery,
      [
        first_name,
        last_name,
        id_number,
        phone_number,
        license_number,
        license_expiry_date,
        status,
      ],
      (err, results) => {
        if (err) {
          console.error("Error adding driver:", err);
          return res.status(500).send("Failed to add driver");
        }
        res.redirect("/drivers?addSuccess=true");
      },
    );
  } else {
    res.status(401).redirect("/login");
  }
});

app.post("/update-driver-status", (req, res) => {
  if (req.session && req.session.user) {
    const { driver_id, status } = req.body;
    const statusMap = {
      active: "active",
      suspended: "suspended",
      terminated: "terminated",
      rest: "on_leave",
    };
    const dbStatus = statusMap[status];

    if (!dbStatus) {
      return res.status(400).send("Invalid status");
    }

    dbConn.query(
      "UPDATE drivers SET status = ? WHERE driver_id = ?",
      [dbStatus, driver_id],
      (err) => {
        if (err) {
          console.error("Error updating driver status:", err);
          return res.status(500).send("Failed to update driver status");
        }
        res.redirect("/drivers?statusUpdated=true");
      },
    );
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
