const bcrypt = require('bcrypt');
const fs = require('fs');

const saltRounds = 10;
const hashedPassword = bcrypt.hashSync("vegetables", saltRounds);

fs.writeFileSync("hashed_password.txt", hashedPassword);