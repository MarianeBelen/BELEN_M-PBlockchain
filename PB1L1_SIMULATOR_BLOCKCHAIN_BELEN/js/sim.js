/*Class Block - managing the contents of the block
           - genetaion of the block
  Class Blockchain - manage your blockchain
           */

class Block {
  constructor(index, timestamp, data, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  // Creates a hash for the block
  calculateHash() {
    return CryptoJS.SHA256(
      this.index +
      this.previousHash +
      this.timestamp +
      this.data +
      this.nonce
    ).toString();
  }
}

// Class Blockchain - manages the whole blockchain
class Blockchain {
  constructor() { // Start the blockchain with the Genesis Block
    this.chain = [this.createGenesisBlock()];
  }

  // Creates the first block in the blockchain
  createGenesisBlock() {
    return new Block(0, new Date().toLocaleString(),
      "Genesis Block",
      "0"
    );
  }

  //Gets the last block in the chain
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Adds a new block to the blockchain
  addBlock(data) {
    const newBlock = new Block(
      this.chain.length,
      new Date().toLocaleString(),
      data,
      this.getLatestBlock().hash
    );

    this.chain.push(newBlock);
  }

  //Checks if all blocks in the chain are valid
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {

      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }
}

// Create blockchain
const blockchain = new Blockchain();


//Get HTML elements
const chainEl = document.getElementById("chain");
const statusEl = document.getElementById("status");
const addBlockBtn = document.getElementById("addBlockBtn");
const validateBtn = document.getElementById("validateBtn");
const blockDataInput = document.getElementById("blockData");


// Display the blockchain
function renderChain() {

  //Clear the current blocks
  chainEl.innerHTML = "";
  //Display each block in the chain
  blockchain.chain.forEach((block, index) => {

    const blockIsValid =
      index === 0 ||
      (
        block.hash === block.calculateHash() &&
        block.previousHash === blockchain.chain[index - 1].hash
      );

    //Create a new HTML element for the block
    const blockDiv = document.createElement("div");
    blockDiv.className = "block";

    //Add the block information to the webpage
    blockDiv.innerHTML = `
      <div class="block-header">
        <h3 style="color: #C2B5DE;">Block #${block.index}</h3>

        <span class="badge ${blockIsValid ? "valid" : "invalid"}">
          ${blockIsValid ? "VALID" : "INVALID"}
        </span>

      </div>


      <div class="field">
        <span class="label"> Timestamp </span>
        <div class="value">${block.timestamp}</div>
      </div>


      <div class="field">
      <span class="label">Data</span>
      <div class="value" contenteditable="true"data-index="${index}" data-field="data">${block.data}</div>
      </div>


      <div class="field">
      <span class="label">Previous Hash</span>
      <div class="value">${block.previousHash}</div>

      </div>


      <div class="field">
      <span class="label"> Block Hash</span>
      <div class="value">${block.hash}</div>
      </div>

    `;
    // Add the block to the webpage
    chainEl.appendChild(blockDiv);

  });


  // makes the data field editable and updates the blockchain when changed
  document.querySelectorAll('[contenteditable="true"]')
    .forEach((element) => {
      element.addEventListener("input", (event) => {
        //get the block number
        const index = Number(event.target.dataset.index);
        blockchain.chain[index].data = event.target.innerText.trim();
        blockchain.chain[index].hash = blockchain.chain[index].calculateHash();
        //Update subsequent blocks' previousHash and hash
        for ( let i = index + 1; i < blockchain.chain.length; i++) {
          blockchain.chain[i].previousHash = blockchain.chain[i - 1].hash;
          blockchain.chain[i].hash = blockchain.chain[i].calculateHash();
        }

        updateStatus();
        renderChain();

      });

    });

}


// Update status of the blockchain
function updateStatus() {
  const isValid = blockchain.isChainValid();
  statusEl.textContent = isValid ? "Chain is Valid" : "Chain is Invalid";
  statusEl.className = `status ${isValid ? "valid" : "invalid"}`;
}

// Add block button
addBlockBtn.addEventListener("click", () => {

  const data = blockDataInput.value.trim() || "Empty Data";
  blockchain.addBlock(data);
  blockDataInput.value = "";
  renderChain();
  updateStatus();

});


// Validate button
validateBtn.addEventListener("click", () => {
  updateStatus();
  renderChain();

});

// Initial dusplay
renderChain();
updateStatus();