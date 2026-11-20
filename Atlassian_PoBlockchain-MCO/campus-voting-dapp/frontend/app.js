const contractAddress = "0xB7fB34dEaAD925d0A2279e06973d73353e518CEC";

let provider;
let signer;
let contract;
let userAccount;
let contractOwner;

// Load the complete ABI from docs/abi.json
async function loadContractABI() {
  const response = await fetch("../docs/abi.json");
  if (!response.ok) {
    throw new Error("Unable to load contract ABI.");
  }
  return await response.json();
}

// Connect MetaMask
async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask first.");
      return;
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    if (!accounts || accounts.length === 0) {
      userAccount = null;
      alert("No MetaMask account is connected.");
      return;
    }
    userAccount = accounts[0];
    provider = new ethers.providers.Web3Provider(window.ethereum);
    // Use the currently selected MetaMask account
    signer = provider.getSigner(userAccount);
    const network = await provider.getNetwork();
    if (network.chainId !== 11155111) {
      alert("Please switch MetaMask to the Sepolia Test Network.");
      return;
    }
    const contractABI = await loadContractABI();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    contractOwner = await contract.owner();
    document.getElementById("walletStatus").textContent =
      "Connected: " + userAccount;
    document.getElementById("connectButton").textContent = "Wallet Connected";
    document.getElementById("connectedVoterAddress").value = userAccount;
    // Update admin access according to the current wallet
    updateAdminAccess();
    await loadElectionData();
    alert("Wallet connected successfully!");
  } catch (error) {
    console.error("Connection failed:", error);
    alert("Connection failed: " + (error.reason || error.message));
  }
}

// Update admin dashboard access
function updateAdminAccess() {
  if (!userAccount || !contractOwner) return;
  const isAdmin = userAccount.toLowerCase() === contractOwner.toLowerCase();
  const adminButtons = [
    "addCandidateButton",
    "authorizeVoterButton",
    "startElectionButton",
    "endElectionButton",
  ];
  adminButtons.forEach(function (buttonId) {
    document.getElementById(buttonId).disabled = !isAdmin;
  });
  document.getElementById("adminLoginStatus").textContent = isAdmin
    ? "Admin verified! Access granted."
    : "Connected wallet is not the administrator.";
}

// Load election information

async function loadElectionData() {
  if (!contract) return;
  try {
    const isOpen = await contract.electionOpen();
    const hasEnded = await contract.electionEnded();
    const votes = await contract.getTotalVotes();

    let status = hasEnded
      ? "Election Ended"
      : isOpen
        ? "Election Ongoing"
        : "Election Not Started";
    document.getElementById("electionStatus").textContent = status;
    document.getElementById("adminElectionStatus").textContent = status;
    document.getElementById("totalVotes").textContent = votes.toString();
    document.getElementById("resultTotalVotes").textContent = votes.toString();

    await loadCandidates();
    await loadResults();
  } catch (error) {
    console.error("Error loading election data:", error);
  }
}

// Verify the Electoral Admin wallet
async function verifyAdminWallet() {
  const status = document.getElementById("adminLoginStatus");

  try {
    // Connect the wallet first
    await connectWallet();

    if (!contract || !userAccount || !contractOwner) {
      status.textContent = "Wallet connection failed. Please try again.";
      return;
    }

    // Compare the connected wallet with the contract owner
    const isAdmin = userAccount.toLowerCase() === contractOwner.toLowerCase();

    if (isAdmin) {
      status.textContent = "Admin verified! Access granted.";

      document.getElementById("adminLoginButton").textContent =
        "Admin Verified";

      // Enable admin management buttons
      document.getElementById("addCandidateButton").disabled = false;
      document.getElementById("authorizeVoterButton").disabled = false;
      document.getElementById("startElectionButton").disabled = false;
      document.getElementById("endElectionButton").disabled = false;

      alert("Welcome, Electoral Administrator!");
    } else {
      status.textContent =
        "Admin wallet not verified. Please connect the designated administrator wallet.";

      document.getElementById("addCandidateButton").disabled = true;
      document.getElementById("authorizeVoterButton").disabled = true;
      document.getElementById("startElectionButton").disabled = true;
      document.getElementById("endElectionButton").disabled = true;

      alert("Access denied. This wallet is not the contract administrator.");
    }
  } catch (error) {
    console.error("Admin verification error:", error);
    status.textContent = "Admin verification failed.";
  }
}

// Load candidates and display voting buttons
async function loadCandidates() {
  if (!contract) return;
  try {
    const candidateList = document.getElementById("candidateList");
    const count = await contract.getCandidateCount();
    candidateList.innerHTML = "";
    if (count.toNumber() === 0) {
      candidateList.textContent = "No candidates have been added yet.";
      return;
    }
    // Check election status
    const isOpen = await contract.electionOpen();
    const hasEnded = await contract.electionEnded();
    let isAuthorized = false;
    let alreadyVoted = false;
    if (userAccount) {
      isAuthorized = await contract.authorizedVoters(userAccount);
      alreadyVoted = await contract.hasVoted(userAccount);
    }
    // Duplicate filtering - KEEP THIS
    const displayedCandidates = new Set();
    for (let i = 1; i <= count.toNumber(); i++) {
      const candidate = await contract.getCandidate(i);
      // Create a unique identifier using name and position
      const uniqueKey =
        candidate.name.trim().toLowerCase() +
        "|" +
        candidate.position.trim().toLowerCase();
      // Skip duplicate candidates
      if (displayedCandidates.has(uniqueKey)) {
        continue;
      }
      displayedCandidates.add(uniqueKey);
      // Create candidate card
      const card = document.createElement("div");
      card.className = "candidate-card";
      const name = document.createElement("h3");
      name.textContent = candidate.name;
      const position = document.createElement("p");
      position.textContent = candidate.position;
      const votes = document.createElement("p");
      votes.textContent = "Votes: " + candidate.voteCount.toString();
      card.appendChild(name);
      card.appendChild(position);
      card.appendChild(votes);
      // Add voting button when election is open
      if (isOpen && !hasEnded) {
        const voteButton = document.createElement("button");
        voteButton.type = "button";
        voteButton.textContent = "Vote for " + candidate.name;
        if (!isAuthorized || alreadyVoted) {
          voteButton.disabled = true;
        } else {
          voteButton.addEventListener("click", () => {
            castVote(i);
          });
        }
        card.appendChild(voteButton);
      }
      candidateList.appendChild(card);
    }
    // Display voter messages
    if (isOpen && !hasEnded && !isAuthorized) {
      const message = document.createElement("p");
      message.textContent = "Your wallet is not authorized to vote.";
      candidateList.appendChild(message);
    } else if (isOpen && alreadyVoted) {
      const message = document.createElement("p");
      message.textContent = "You have already cast your vote.";
      candidateList.appendChild(message);
    }
  } catch (error) {
    console.error("Error loading candidates:", error);
  }
}

// Add a new candidate
async function addCandidate() {
  if (!contract) {
    alert("Please connect your wallet first.");
    return;
  }

  try {
    const name = document.getElementById("candidateName").value.trim();
    const position = document.getElementById("candidatePosition").value.trim();

    if (name === "" || position === "") {
      alert("Please enter both candidate name and position.");
      return;
    }
    const isAdmin = userAccount.toLowerCase() === contractOwner.toLowerCase();
    if (!isAdmin) {
      alert("Only the Electoral Administrator can add candidates.");
      return;
    }
    const isOpen = await contract.electionOpen();
    const hasEnded = await contract.electionEnded();
    if (isOpen || hasEnded) {
      alert(
        "Candidates cannot be added because the election is already open or has ended.",
      );
      return;
    }
    const transaction = await contract.addCandidate(name, position);
    alert("Transaction submitted! Please wait for confirmation.");
    await transaction.wait();
    alert("Candidate added successfully!");
    document.getElementById("candidateName").value = "";
    document.getElementById("candidatePosition").value = "";
    await loadElectionData();
  } catch (error) {
    console.error("Add candidate error:", error);
    alert(
      "Unable to add candidate: " +
        (error.reason || error.data?.message || error.message),
    );
  }
}

// Start the election
async function startElection() {
  if (!contract) {
    alert("Please connect your wallet first.");
    return;
  }

  try {
    if (userAccount.toLowerCase() !== contractOwner.toLowerCase()) {
      alert("Only the Electoral Administrator can start the election.");
      return;
    }
    const isOpen = await contract.electionOpen();
    const hasEnded = await contract.electionEnded();
    if (isOpen) {
      alert("The election is already open!");
      return;
    }
    if (hasEnded) {
      alert("This election has already ended.");
      return;
    }

    const count = await contract.getCandidateCount();
    if (count.toNumber() < 2) {
      alert("Please add at least two candidates first.");
      return;
    }
    const transaction = await contract.startElection();
    alert("Starting election transaction...");
    await transaction.wait();
    alert("Election started successfully!");
    await loadElectionData();
  } catch (error) {
    console.error("Start election error:", error);
    alert("Unable to start election: " + (error.reason || error.message));
  }
}

// Close the election
async function endElection() {
  if (!contract) {
    alert("Please connect your wallet first.");
    return;
  }
  try {
    if (userAccount.toLowerCase() !== contractOwner.toLowerCase()) {
      alert("Only the Electoral Administrator can close the election.");
      return;
    }
    const isOpen = await contract.electionOpen();
    const hasEnded = await contract.electionEnded();
    if (hasEnded) {
      alert("The election has already ended.");
      return;
    }
    if (!isOpen) {
      alert("The election has not started yet.");
      return;
    }
    const confirmEnd = confirm(
      "Are you sure you want to close the election? No more votes will be accepted.",
    );
    if (!confirmEnd) {
      return;
    }
    const transaction = await contract.endElection();
    alert("Closing election... Please wait for confirmation.");
    await transaction.wait();
    alert("Election closed successfully!");
    await loadElectionData();
  } catch (error) {
    console.error("End election error:", error);
    alert(
      "Unable to close election: " +
        (error.reason || error.data?.message || error.message),
    );
  }
}

// Listen for MetaMask account changes
if (window.ethereum) {
  window.ethereum.on("accountsChanged", async function (accounts) {
    if (!accounts || accounts.length === 0) {
      userAccount = null;
      signer = null;
      contract = null;
      document.getElementById("walletStatus").textContent =
        "Wallet disconnected";
      document.getElementById("connectedVoterAddress").value = "";
      document.getElementById("connectButton").textContent = "Connect Wallet";
      document.getElementById("adminLoginStatus").textContent =
        "Please connect the administrator wallet.";

      [
        "addCandidateButton",
        "authorizeVoterButton",
        "startElectionButton",
        "endElectionButton",
      ].forEach(function (id) {
        document.getElementById(id).disabled = true;
      });
      return;
    }
    try {
      userAccount = accounts[0];
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner(userAccount);
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111) {
        alert("Please switch to Sepolia.");
        return;
      }
      const contractABI = await loadContractABI();
      contract = new ethers.Contract(contractAddress, contractABI, signer);
      contractOwner = await contract.owner();
      document.getElementById("walletStatus").textContent =
        "Connected: " + userAccount;
      document.getElementById("connectButton").textContent = "Wallet Connected";
      updateAdminAccess();
      document.getElementById("connectedVoterAddress").value = userAccount;
      await loadElectionData();
    } catch (error) {
      console.error("Account change error:", error);
    }
  });
  window.ethereum.on("chainChanged", function () {
    window.location.reload();
  });
}

// Authorize a voter
async function authorizeVoter() {
  if (!contract) {
    alert("Please connect your wallet first.");
    return;
  }

  try {
    if (userAccount.toLowerCase() !== contractOwner.toLowerCase()) {
      alert("Only the Electoral Administrator can authorize voters.");
      return;
    }
    const isOpen = await contract.electionOpen();
    const hasEnded = await contract.electionEnded();
    if (isOpen || hasEnded) {
      alert(
        "Voters cannot be authorized because the election is already open or has ended.",
      );
      return;
    }
    const voterAddress = document.getElementById("voterAddress").value.trim();
    if (!ethers.utils.isAddress(voterAddress)) {
      alert("Please enter a valid Ethereum wallet address.");
      return;
    }
    const isRegistered = await contract.registeredVoters(voterAddress);
    if (!isRegistered) {
      alert("This wallet has not registered as a voter yet.");
      return;
    }
    const alreadyAuthorized = await contract.authorizedVoters(voterAddress);
    if (alreadyAuthorized) {
      alert("This voter is already authorized.");
      return;
    }
    const transaction = await contract.authorizeVoter(voterAddress);
    alert("Authorization transaction submitted. Please wait...");
    await transaction.wait();
    alert("Voter authorized successfully!");
    document.getElementById("voterAddress").value = "";
  } catch (error) {
    console.error("Authorize voter error:", error);
    alert("Unable to authorize voter: " + (error.reason || error.message));
  }
}

// Register a voter through the website
async function registerVoter(event) {
  event.preventDefault();
  if (!contract) {
    alert("Please connect your MetaMask wallet first.");
    return;
  }
  try {
    const name = document.getElementById("voterName").value.trim();
    const studentId = document.getElementById("studentId").value.trim();
    const email = document.getElementById("voterEmail").value.trim();
    if (name === "" || studentId === "" || email === "") {
      alert("Please complete all registration fields.");
      return;
    }
    // Check election status
    const isOpen = await contract.electionOpen();
    const hasEnded = await contract.electionEnded();
    if (isOpen || hasEnded) {
      alert("Voter registration is closed.");
      return;
    }
    // Check whether this wallet is already registered
    const isRegistered = await contract.registeredVoters(userAccount);
    if (isRegistered) {
      alert("This wallet is already registered!");
      return;
    }

    // Register the connected wallet on the blockchain
    const transaction = await contract.registerVoter();

    alert("Registration submitted! Please confirm and wait.");
    await transaction.wait();
    alert(
      "Voter registration successful! Please wait for Admin authorization.",
    );
    document.getElementById("registrationForm").reset();
    document.getElementById("connectedVoterAddress").value = userAccount;
  } catch (error) {
    console.error("Voter registration error:", error);
    alert(
      "Registration failed: " +
        (error.reason || error.data?.message || error.message),
    );
  }
}

// Cast a vote for a candidate
async function castVote(candidateId) {
  if (!contract || !userAccount) {
    alert("Please connect your MetaMask wallet first.");
    return;
  }
  try {
    const isOpen = await contract.electionOpen();
    const hasEnded = await contract.electionEnded();
    if (!isOpen || hasEnded) {
      alert("Voting is not currently open.");
      return;
    }
    const isAuthorized = await contract.authorizedVoters(userAccount);
    if (!isAuthorized) {
      alert("Your wallet is not authorized to vote.");
      return;
    }
    const alreadyVoted = await contract.hasVoted(userAccount);
    if (alreadyVoted) {
      alert("You have already voted. Each wallet can vote only once.");
      return;
    }
    const confirmVote = confirm(
      "Are you sure you want to vote for this candidate? You cannot change your vote afterward.",
    );
    if (!confirmVote) {
      return;
    }
    const transaction = await contract.vote(candidateId);
    alert("Vote submitted! Please confirm the transaction in MetaMask.");
    await transaction.wait();
    alert("Your vote has been recorded successfully!");
    await loadElectionData();
  } catch (error) {
    console.error("Voting error:", error);
    alert(
      "Unable to cast vote: " +
        (error.reason || error.data?.message || error.message),
    );
  }
}

// Display final election results
async function loadResults() {
  if (!contract) return;

  try {
    const resultsMessage = document.getElementById("resultsMessage");
    const resultsList = document.getElementById("resultsList");
    const resultTotalVotes = document.getElementById("resultTotalVotes");

    const hasEnded = await contract.electionEnded();
    const totalVotes = await contract.getTotalVotes();

    resultTotalVotes.textContent = totalVotes.toString();
    resultsList.innerHTML = "";

    if (!hasEnded) {
      resultsMessage.textContent =
        "Results Not Yet Available. The election is still ongoing or has not started.";

      return;
    }

    resultsMessage.textContent = "Final Election Results";

    const count = await contract.getCandidateCount();

    if (count.toNumber() === 0) {
      resultsList.textContent = "No candidates were found.";
      return;
    }

    let highestVotes = -1;
    let winners = [];

    const candidates = [];

    // Get the vote count of every candidate
    for (let i = 1; i <= count.toNumber(); i++) {
      const candidate = await contract.getCandidate(i);
      const voteCount = candidate.voteCount.toNumber();

      candidates.push({
        name: candidate.name,
        position: candidate.position,
        votes: voteCount,
      });

      if (voteCount > highestVotes) {
        highestVotes = voteCount;
        winners = [candidate.name];
      } else if (voteCount === highestVotes) {
        winners.push(candidate.name);
      }
    }

    // Display each candidate's final vote count
    for (const candidate of candidates) {
      const resultItem = document.createElement("div");
      resultItem.className = "result-card";
      const name = document.createElement("h3");
      name.textContent = candidate.name;
      const position = document.createElement("p");
      position.textContent = candidate.position;
      const votes = document.createElement("p");
      votes.textContent = "Final Votes: " + candidate.votes;
      resultItem.appendChild(name);
      resultItem.appendChild(position);
      resultItem.appendChild(votes);
      resultsList.appendChild(resultItem);
    }
    // Display the winner or a tie
    const winnerMessage = document.createElement("h3");
    if (winners.length === 1) {
      winnerMessage.textContent = "Winner: " + winners[0];
    } else {
      winnerMessage.textContent = "Tie between: " + winners.join(", ");
    }
    resultsList.appendChild(winnerMessage);
  } catch (error) {
    console.error("Error loading final results:", error);
  }
}

// Connect button
document
  .getElementById("connectButton")
  .addEventListener("click", connectWallet);

// Admin login button
document
  .getElementById("adminLoginButton")
  .addEventListener("click", verifyAdminWallet);

//candidate button
document
  .getElementById("addCandidateButton")
  .addEventListener("click", addCandidate);

//authorize voter button
document
  .getElementById("authorizeVoterButton")
  .addEventListener("click", authorizeVoter);

//start election button
document
  .getElementById("startElectionButton")
  .addEventListener("click", startElection);

// Voter registration form
document
  .getElementById("registrationForm")
  .addEventListener("submit", registerVoter);

//close election button
document
  .getElementById("endElectionButton")
  .addEventListener("click", endElection);
