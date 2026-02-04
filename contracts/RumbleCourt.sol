// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RumbleCourt
 * @dev Minimal AI-driven courtroom simulator with on-chain trial recording
 * Records case submissions, trial outcomes, and maintains transparency
 */
contract RumbleCourt {
    // ============ Enums ============

    enum CaseStatus {
        PENDING,
        IN_TRIAL,
        COMPLETED,
        APPEALED
    }
    enum VerdictType {
        GUILTY,
        NOT_GUILTY,
        SETTLEMENT,
        DISMISSED
    }

    // ============ Structs ============

    struct Case {
        uint256 caseId;
        address plaintiff;
        string caseTitle;
        string evidenceHash; // IPFS hash or summary
        uint256 filedAt;
        CaseStatus status;
    }

    struct Verdict {
        uint256 caseId;
        VerdictType verdictType;
        string reasoning;
        uint256 timestamp;
        bool isFinal;
    }

    // ============ State Variables ============

    mapping(uint256 => Case) public cases;
    mapping(uint256 => Verdict) public verdicts;
    mapping(address => uint256[]) public userCases;

    uint256 public nextCaseId = 1;
    address public owner;

    // ============ Events ============

    event CaseFiled(
        uint256 indexed caseId,
        address indexed plaintiff,
        string caseTitle
    );
    event TrialStarted(uint256 indexed caseId);
    event VerdictRecorded(
        uint256 indexed caseId,
        VerdictType verdictType,
        bool isFinal
    );
    event CaseAppealed(uint256 indexed caseId);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier caseExists(uint256 caseId) {
        require(caseId > 0 && caseId < nextCaseId, "Case does not exist");
        _;
    }

    // ============ Constructor ============

    constructor() {
        owner = msg.sender;
    }

    // ============ Core Functions ============

    /**
     * @dev File a new case for AI trial simulation
     * @param caseTitle Brief title of the case
     * @param evidenceHash IPFS hash or evidence summary
     * @return caseId The unique identifier for the case
     */
    function fileCase(
        string calldata caseTitle,
        string calldata evidenceHash
    ) external returns (uint256 caseId) {
        caseId = nextCaseId++;

        cases[caseId] = Case({
            caseId: caseId,
            plaintiff: msg.sender,
            caseTitle: caseTitle,
            evidenceHash: evidenceHash,
            filedAt: block.timestamp,
            status: CaseStatus.PENDING
        });

        userCases[msg.sender].push(caseId);

        emit CaseFiled(caseId, msg.sender, caseTitle);
    }

    /**
     * @dev Start trial for a pending case (owner or case creator)
     * @param caseId The case identifier
     */
    function startTrial(uint256 caseId) external caseExists(caseId) {
        require(
            cases[caseId].status == CaseStatus.PENDING,
            "Case must be pending"
        );
        require(
            msg.sender == owner || msg.sender == cases[caseId].plaintiff,
            "Only owner or case creator can start trial"
        );

        cases[caseId].status = CaseStatus.IN_TRIAL;

        emit TrialStarted(caseId);
    }

    /**
     * @dev Record AI-generated verdict for a case
     * @param caseId The case identifier
     * @param verdictType The type of verdict
     * @param reasoning AI judge's reasoning
     * @param isFinal Whether this is the final verdict
     */
    function recordVerdict(
        uint256 caseId,
        VerdictType verdictType,
        string calldata reasoning,
        bool isFinal
    ) external caseExists(caseId) {
        require(
            cases[caseId].status == CaseStatus.IN_TRIAL,
            "Case must be in trial"
        );
        require(
            msg.sender == owner || msg.sender == cases[caseId].plaintiff,
            "Only owner or case creator can record verdict"
        );

        verdicts[caseId] = Verdict({
            caseId: caseId,
            verdictType: verdictType,
            reasoning: reasoning,
            timestamp: block.timestamp,
            isFinal: isFinal
        });

        if (isFinal) {
            cases[caseId].status = CaseStatus.COMPLETED;
        }

        emit VerdictRecorded(caseId, verdictType, isFinal);
    }

    /**
     * @dev Appeal a completed case
     * @param caseId The case identifier
     */
    function appealCase(uint256 caseId) external caseExists(caseId) {
        require(
            cases[caseId].plaintiff == msg.sender,
            "Only plaintiff can appeal"
        );
        require(
            cases[caseId].status == CaseStatus.COMPLETED,
            "Case must be completed"
        );
        require(verdicts[caseId].isFinal, "Verdict must be final");

        cases[caseId].status = CaseStatus.APPEALED;

        emit CaseAppealed(caseId);
    }

    // ============ View Functions ============

    /**
     * @dev Get case details
     * @param caseId The case identifier
     * @return Case struct
     */
    function getCase(
        uint256 caseId
    ) external view caseExists(caseId) returns (Case memory) {
        return cases[caseId];
    }

    /**
     * @dev Get verdict for a case
     * @param caseId The case identifier
     * @return Verdict struct
     */
    function getVerdict(
        uint256 caseId
    ) external view caseExists(caseId) returns (Verdict memory) {
        require(verdicts[caseId].timestamp > 0, "No verdict recorded");
        return verdicts[caseId];
    }

    /**
     * @dev Get all cases filed by a user
     * @param user User address
     * @return Array of case IDs
     */
    function getUserCases(
        address user
    ) external view returns (uint256[] memory) {
        return userCases[user];
    }

    /**
     * @dev Get total number of cases
     * @return Total case count
     */
    function getTotalCases() external view returns (uint256) {
        return nextCaseId - 1;
    }

    /**
     * @dev Check if a case has a verdict
     * @param caseId The case identifier
     * @return True if verdict exists
     */
    function hasVerdict(
        uint256 caseId
    ) external view caseExists(caseId) returns (bool) {
        return verdicts[caseId].timestamp > 0;
    }
}
