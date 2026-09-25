/*
    PostIt

    This program lets one person just type in their info once, 
    and then go ahead and create posts. 
    The username, the post, an d the date get turned into a JSON 
    string, and after that that string is encrypted with CryptoJS.
*/


//store the current user's information
let user = null;


//Store all posts
let posts = [];


// Get HTML elements
const userSection = document.getElementById("userSection");
const postSection = document.getElementById("postSection");
const fullNameInput = document.getElementById("fullName");
const birthDateInput = document.getElementById("birthDate");
const yearLevelInput = document.getElementById("yearLevel");
const genderInput = document.getElementById("gender");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const saveUserBtn = document.getElementById("saveUserBtn");
const welcomeUser = document.getElementById("welcomeUser");
const postInput = document.getElementById("postInput");
const postBtn = document.getElementById("postBtn");
const postsElement = document.getElementById("posts");

// Encryption key
// This is only for demonstration purposes.
const secretKey = "PostItSecretKey";

// Save user information
saveUserBtn.addEventListener("click", () => {

    // Get the values entered by the user
    const fullName = fullNameInput.value.trim();
    const birthDate = birthDateInput.value;
    const yearLevel = yearLevelInput.value.trim();
    const gender = genderInput.value;
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Check if the required information is complete
    if (
        fullName === "" ||
        birthDate === "" ||
        yearLevel === "" ||
        gender === "" ||
        username === "" ||
        password === ""
    ) {

        alert("Please complete all information.");
        return;

    }

    //object to store the user information
    user = {

        fullName: fullName,
        birthDate: birthDate,
        yearLevel: yearLevel,
        gender: gender,
        username: username,
        password: password

    };


    //hide the user information section
    userSection.classList.add("hidden");

    //Show the posting section
    postSection.classList.remove("hidden");

    //Show the username
    welcomeUser.textContent =
        "Welcome, " + user.username + "! You can now create a post.";

});


// Add a new post
postBtn.addEventListener("click", () => {
    // Get the caption
    const caption = postInput.value.trim();
    // Check if the caption is empty
    if (caption === "") {
        alert("Please write a caption.");
        return;
    }

    // Get the current date and time
    const date = new Date().toLocaleString();

    /*
        Create the information that will be encrypted.
        It contains:
        Username
        Post
        Date
    */
    const postData = {
        username: user.username,
        post: caption,
        date: date
    };

    /*
        Convert the post information into a string
        before encryption.
    */
    const stringData = JSON.stringify(postData);

    //Encrypt the string using CryptoJS AES.
    const encryptedData =
        CryptoJS.AES.encrypt(
            stringData,
            secretKey
        ).toString();

    // Create a new post object
    const newPost = {
        caption: caption,
        date: date,
        encrypted: encryptedData
    };

    // Add the post to the posts array
    posts.push(newPost);
    // Clear the textbox
    postInput.value = "";
    // Display the posts
    renderPosts();
});

//Display all posts
function renderPosts() {
    // Clear the current posts
    postsElement.innerHTML = "";
    //Display every post
    posts.forEach((post, index) => {
        //Create a new div for the post
        const postDiv = document.createElement("div");

        postDiv.className = "post";

        /*
            Display the original post and
            encrypted value.
        */
        postDiv.innerHTML = `
            <div class="original">
                ORIGINAL POST
            </div>

            <div class="caption">
                ${post.caption}
            </div>

            <div class="post-date">
                Date: ${post.date}
            </div>

            <div class="original">
                ENCRYPTED VALUE
            </div>

            <div class="encrypted">
                ${post.encrypted}
            </div>

        `;
        // Add the post to the page
        postsElement.appendChild(postDiv);

    });

}