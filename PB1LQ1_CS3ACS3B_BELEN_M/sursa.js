/* RSA ENROLLMENT SYSTEm*/

let keySize = 1024;
if (window.location.pathname.includes("3072")) {
  keySize = 3072;
}

/* Enrollment button */
const encryptBtn = document.getElementById("encryptBtn");

/*result areas */
const originalData = document.getElementById("originalData");
const publicKey = document.getElementById("publicKey");
const encryptedData = document.getElementById("encryptedData");
const privateKey = document.getElementById("privateKey");
const decryptedData = document.getElementById("decryptedData");
const status = document.getElementById("status");

/* Enrollment button*/
encryptBtn.addEventListener("click", function () {
  /* Get information from the form */
  const fullname = document.getElementById("fullname").value;
  const dob = document.getElementById("dob").value;
  const yearlevel = document.getElementById("yearlevel").value;
  const gender = document.getElementById("gender").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  /* Validation*/
  if (
    fullname === "" ||
    dob === "" ||
    yearlevel === "" ||
    gender === "" ||
    username === "" ||
    password === ""
  ) {
    status.textContent = "Please complete all fields.";
    return;
  }

  /*User data using object */
  const userData = {
    fullName: fullname,
    dateOfBirth: dob,
    yearLevel: yearlevel,
    gender: gender,
    username: username,
    password: password,
  };

  /*convert the object into a string.*/
  const stringData = JSON.stringify(userData);

  /* Shows the original data */
  originalData.textContent = stringData;

  /*Create RSA key pair*/
  const crypt = new JSEncrypt({
    default_key_size: keySize,
  });

  /*Generate the RSA key pair */
  crypt.getKey();

  /*public key */
  const generatedPublicKey = crypt.getPublicKey();

  /*private key */
  const generatedPrivateKey = crypt.getPrivateKey();

  /* Display the keys */
  publicKey.textContent = generatedPublicKey;
  privateKey.textContent = generatedPrivateKey;

  /* Encrypt each field separately */
  let encryptedFullName = crypt.encrypt(fullname);
  let encryptedDOB = crypt.encrypt(dob);
  let encryptedYearLevel = crypt.encrypt(yearlevel);
  let encryptedGender = crypt.encrypt(gender);
  let encryptedUsername = crypt.encrypt(username);
  let encryptedPassword = crypt.encrypt(password);

  /* Checks if encryption worked */
  if (
    !encryptedFullName ||
    !encryptedDOB ||
    !encryptedYearLevel ||
    !encryptedGender ||
    !encryptedUsername ||
    !encryptedPassword
  ) {
    encryptedData.textContent = "Encryption failed.";
    decryptedData.textContent = "No decrypted data.";
    status.textContent = "RSA encryption failed.";
    return;
  }

  /*Put all encrypted fields together so they can be displayed.*/
  const encryptedUserData = {
    fullName: encryptedFullName,
    dateOfBirth: encryptedDOB,
    yearLevel: encryptedYearLevel,
    gender: encryptedGender,
    username: encryptedUsername,
    password: encryptedPassword,
  };

  /* Display encrypted information */
  encryptedData.textContent = JSON.stringify(encryptedUserData, null, 2);

  /* Decrypt each field*/
  const decryptedFullName = crypt.decrypt(encryptedFullName);
  const decryptedDOB = crypt.decrypt(encryptedDOB);
  const decryptedYearLevel = crypt.decrypt(encryptedYearLevel);
  const decryptedGender = crypt.decrypt(encryptedGender);
  const decryptedUsername = crypt.decrypt(encryptedUsername);
  const decryptedPassword = crypt.decrypt(encryptedPassword);

  /* Check if decryption worked */
  if (
    !decryptedFullName ||
    !decryptedDOB ||
    !decryptedYearLevel ||
    !decryptedGender ||
    !decryptedUsername ||
    !decryptedPassword
  ) {
    decryptedData.textContent = "Decryption failed.";
    status.textContent = "RSA decryption failed.";
    return;
  }

  /* Create decrypted user object*/
  const decryptedUserData = {
    fullName: decryptedFullName,
    dateOfBirth: decryptedDOB,
    yearLevel: decryptedYearLevel,
    gender: decryptedGender,
    username: decryptedUsername,
    password: decryptedPassword,
  };

  /* Display decrypted information */
  decryptedData.textContent = JSON.stringify(decryptedUserData, null, 2);

  /* Final status*/
  status.textContent =
    "Enrollment successful! " +
    keySize +
    "-bit RSA encryption and decryption completed.";

  console.log("RSA Key Size:", keySize);
  console.log("Original Data:", stringData);
  console.log("Encrypted Data:", encryptedUserData);
  console.log("Decrypted Data:", decryptedUserData);
});
