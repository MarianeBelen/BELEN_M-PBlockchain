
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CampusVoting is Ownable {

    //Candidate information
    struct Candidate {
        uint256 id;
        string name;
        string position;
        uint256 voteCount;
        bool exists;
    }

    //election information
    uint256 public candidateCount;
    uint256 public totalVotes;

    bool public electionOpen;
    bool public electionEnded;

    //Voter information
    mapping(address => bool) public registeredVoters;
    mapping(address => bool) public authorizedVoters;
    mapping(address => bool) public hasVoted;

    //Candidate records
    mapping(uint256 => Candidate) public candidates;

    //Events
    event VoterRegistered(address indexed voter);
    event VoterAuthorized(address indexed voter);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event ElectionStatusChanged(bool isOpen);

    //contract deployer becomes admin
    constructor() Ownable(msg.sender) {
        electionOpen = false;
        electionEnded = false;
    }

    //1. Voter registration
    function registerVoter() external {
        require(!electionOpen, "Election is open");
        require(!electionEnded, "Election has ended");
        require(!registeredVoters[msg.sender], "Already registered");

        registeredVoters[msg.sender] = true;

        emit VoterRegistered(msg.sender);
    }

    //2. Admin authorizes voters
    function authorizeVoter(address _voter) external onlyOwner {
        require(!electionOpen, "Election is open");
        require(!electionEnded, "Election has ended");
        require(_voter != address(0), "Invalid address");
        require(registeredVoters[_voter], "Voter not registered");

        authorizedVoters[_voter] = true;

        emit VoterAuthorized(_voter);
    }

    //3. Admin adds candidates
    function addCandidate(
        string calldata _name,
        string calldata _position
    ) external onlyOwner {
        require(!electionOpen, "Election is open");
        require(!electionEnded, "Election has ended");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_position).length > 0, "Position required");

        candidateCount++;

        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            position: _position,
            voteCount: 0,
            exists: true
        });

        emit CandidateAdded(candidateCount, _name);
    }

    //4. Admin starts election
    function startElection() external onlyOwner {
        require(!electionOpen, "Already open");
        require(!electionEnded, "Election already ended");
        require(candidateCount >= 2, "Add at least two candidates");

        electionOpen = true;

        emit ElectionStatusChanged(true);
    }

    //5. Authorized voters cast their vote
    function vote(uint256 _candidateId) external {
        require(electionOpen, "Election is not open");
        require(authorizedVoters[msg.sender], "Not authorized");
        require(!hasVoted[msg.sender], "Already voted");
        require(candidates[_candidateId].exists, "Invalid candidate");

        hasVoted[msg.sender] = true;

        candidates[_candidateId].voteCount++;
        totalVotes++;

        emit VoteCast(msg.sender, _candidateId);
    }

    //6. Admin closes election
    function endElection() external onlyOwner {
        require(electionOpen, "Election is not open");

        electionOpen = false;
        electionEnded = true;

        emit ElectionStatusChanged(false);
    }

    //7. View candidate information
    function getCandidate(
        uint256 _candidateId
    ) external view returns (Candidate memory) {
        require(candidates[_candidateId].exists, "Invalid candidate");

        return candidates[_candidateId];
    }

    //8. Get candidate count
    function getCandidateCount() external view returns (uint256) {
        return candidateCount;
    }

    //9. Get total votes
    function getTotalVotes() external view returns (uint256) {
        return totalVotes;
    }

    //10. Get election status
    function getElectionStatus() external view returns (bool) {
        return electionOpen;
    }
}
