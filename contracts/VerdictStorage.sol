// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IVerdictStorage.sol";

/**
 * @title VerdictStorage
 * @dev Implementation of verdict storage and management for the courtroom system
 * Ensures immutability through comprehensive event logging and transparent verdict tracking
 */
contract VerdictStorage is IVerdictStorage {
    // State variables
    mapping(uint256 => Verdict) private _verdicts;
    mapping(uint256 => Appeal) private _appeals;
    mapping(uint256 => uint256[]) private _caseVerdicts;
    mapping(uint256 => uint256[]) private _verdictAppeals;
    mapping(address => uint256[]) private _judgeVerdicts;
    mapping(address => uint256[]) private _appellantAppeals;

    uint256 private _nextVerdictId = 1;
    uint256 private _nextAppealId = 1;

    // Access control - only judges can record verdicts
    mapping(address => bool) private _authorizedJudges;

    // Contract owner
    address private _owner;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorizedJudge() {
        require(_authorizedJudges[msg.sender], "Only authorized judges can perform this action");
        _;
    }

    constructor() {
        _owner = msg.sender;
    }

    /**
     * @dev Add an authorized judge (only owner)
     * @param judge Address of the judge to authorize
     */
    function addAuthorizedJudge(address judge) external onlyOwner {
        _authorizedJudges[judge] = true;
    }

    /**
     * @dev Remove an authorized judge (only owner)
     * @param judge Address of the judge to remove
     */
    function removeAuthorizedJudge(address judge) external onlyOwner {
        _authorizedJudges[judge] = false;
    }

    /**
     * @dev Check if an address is an authorized judge
     * @param judge Address to check
     * @return True if authorized judge, false otherwise
     */
    function isAuthorizedJudge(address judge) external view returns (bool) {
        return _authorizedJudges[judge];
    }

    /**
     * @dev Record a verdict for a case
     * @param caseId The case identifier
     * @param verdictType The type of verdict
     * @param verdictDetails Detailed verdict information
     * @param reasoning Judge's reasoning for the verdict
     * @param supportingDocumentsText Text-based supporting documents
     * @param isFinal Whether this is the final verdict
     * @return verdictId The unique identifier for the recorded verdict
     */
    function recordVerdict(
        uint256 caseId,
        VerdictType verdictType,
        string calldata verdictDetails,
        string calldata reasoning,
        string[] calldata supportingDocumentsText,
        bool isFinal
    ) external onlyAuthorizedJudge returns (uint256 verdictId) {
        verdictId = _nextVerdictId++;

        _verdicts[verdictId] = Verdict({
            caseId: caseId,
            verdictId: verdictId,
            judge: msg.sender,
            verdictType: verdictType,
            verdictDetails: verdictDetails,
            reasoning: reasoning,
            timestamp: block.timestamp,
            isFinal: isFinal,
            supportingDocumentsText: supportingDocumentsText
        });

        _caseVerdicts[caseId].push(verdictId);
        _judgeVerdicts[msg.sender].push(verdictId);

        emit VerdictRecorded(caseId, verdictId, msg.sender, verdictType, isFinal);

        if (isFinal) {
            emit VerdictFinalized(caseId, verdictId);
        }
    }

    /**
     * @dev Finalize a verdict (mark as final and immutable)
     * @param verdictId The verdict identifier to finalize
     */
    function finalizeVerdict(uint256 verdictId) external onlyAuthorizedJudge {
        require(_verdicts[verdictId].verdictId != 0, "Verdict does not exist");
        require(!_verdicts[verdictId].isFinal, "Verdict is already final");

        _verdicts[verdictId].isFinal = true;

        emit VerdictFinalized(_verdicts[verdictId].caseId, verdictId);
    }

    /**
     * @dev File an appeal against a verdict
     * @param originalVerdictId The verdict being appealed
     * @param appealReason Reason for the appeal
     * @param appealDocumentsText Text-based appeal documents
     * @return appealId The unique identifier for the filed appeal
     */
    function fileAppeal(
        uint256 originalVerdictId,
        string calldata appealReason,
        string[] calldata appealDocumentsText
    ) external returns (uint256 appealId) {
        require(_verdicts[originalVerdictId].verdictId != 0, "Original verdict does not exist");
        require(_verdicts[originalVerdictId].isFinal, "Cannot appeal non-final verdict");

        appealId = _nextAppealId++;

        _appeals[appealId] = Appeal({
            appealId: appealId,
            originalVerdictId: originalVerdictId,
            appellant: msg.sender,
            appealReason: appealReason,
            status: AppealStatus.FILED,
            filingDate: block.timestamp,
            hearingDate: 0,
            appealDocumentsText: appealDocumentsText
        });

        _verdictAppeals[originalVerdictId].push(appealId);
        _appellantAppeals[msg.sender].push(appealId);

        emit AppealFiled(appealId, originalVerdictId, msg.sender, appealReason);
    }

    /**
     * @dev Update appeal status and decision
     * @param appealId The appeal identifier
     * @param status New status for the appeal
     * @param decisionDetails Details of the appeal decision
     */
    function updateAppealStatus(
        uint256 appealId,
        AppealStatus status,
        string calldata decisionDetails
    ) external onlyAuthorizedJudge {
        require(_appeals[appealId].appealId != 0, "Appeal does not exist");

        _appeals[appealId].status = status;

        emit AppealDecision(appealId, status, decisionDetails);
    }

    /**
     * @dev Schedule a hearing date for an appeal
     * @param appealId The appeal identifier
     * @param hearingDate The scheduled hearing date (timestamp)
     */
    function scheduleAppealHearing(uint256 appealId, uint256 hearingDate) external onlyAuthorizedJudge {
        require(_appeals[appealId].appealId != 0, "Appeal does not exist");
        require(hearingDate > block.timestamp, "Hearing date must be in the future");

        _appeals[appealId].hearingDate = hearingDate;
        _appeals[appealId].status = AppealStatus.SCHEDULED;
    }

    // View functions for transparency

    /**
     * @dev Get verdict details by ID
     * @param verdictId The verdict identifier
     * @return Verdict struct with complete verdict information
     */
    function getVerdict(uint256 verdictId) external view returns (Verdict memory) {
        require(_verdicts[verdictId].verdictId != 0, "Verdict does not exist");
        return _verdicts[verdictId];
    }

    /**
     * @dev Get all verdicts for a case
     * @param caseId The case identifier
     * @return Array of verdict IDs associated with the case
     */
    function getVerdictsByCase(uint256 caseId) external view returns (uint256[] memory) {
        return _caseVerdicts[caseId];
    }

    /**
     * @dev Get appeal details by ID
     * @param appealId The appeal identifier
     * @return Appeal struct with complete appeal information
     */
    function getAppeal(uint256 appealId) external view returns (Appeal memory) {
        require(_appeals[appealId].appealId != 0, "Appeal does not exist");
        return _appeals[appealId];
    }

    /**
     * @dev Get appeals for a specific verdict
     * @param verdictId The verdict identifier
     * @return Array of appeal IDs related to the verdict
     */
    function getAppealsByVerdict(uint256 verdictId) external view returns (uint256[] memory) {
        require(_verdicts[verdictId].verdictId != 0, "Verdict does not exist");
        return _verdictAppeals[verdictId];
    }

    /**
     * @dev Get verdicts issued by a specific judge
     * @param judge Address of the judge
     * @return Array of verdict IDs issued by the judge
     */
    function getVerdictsByJudge(address judge) external view returns (uint256[] memory) {
        return _judgeVerdicts[judge];
    }

    /**
     * @dev Get appeals filed by a specific appellant
     * @param appellant Address of the appellant
     * @return Array of appeal IDs filed by the appellant
     */
    function getAppealsByAppellant(address appellant) external view returns (uint256[] memory) {
        return _appellantAppeals[appellant];
    }

    /**
     * @dev Check if a verdict is final
     * @param verdictId The verdict identifier
     * @return True if verdict is final, false otherwise
     */
    function isVerdictFinal(uint256 verdictId) external view returns (bool) {
        require(_verdicts[verdictId].verdictId != 0, "Verdict does not exist");
        return _verdicts[verdictId].isFinal;
    }

    /**
     * @dev Get total number of verdicts recorded
     * @return Total verdict count
     */
    function getTotalVerdicts() external view returns (uint256) {
        return _nextVerdictId - 1;
    }

    /**
     * @dev Get total number of appeals filed
     * @return Total appeal count
     */
    function getTotalAppeals() external view returns (uint256) {
        return _nextAppealId - 1;
    }
}