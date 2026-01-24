// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IVerdictStorage
 * @dev Interface for verdict storage and management in the courtroom system
 * Ensures immutability through comprehensive event logging and transparent verdict tracking
 */
interface IVerdictStorage {
    // Structs
    struct Verdict {
        uint256 caseId;
        uint256 verdictId;
        address judge;
        VerdictType verdictType;
        string verdictDetails;
        string reasoning;
        uint256 timestamp;
        bool isFinal;
        string[] supportingDocumentsText; // Text-based supporting documents stored on-chain
    }

    struct Appeal {
        uint256 appealId;
        uint256 originalVerdictId;
        address appellant;
        string appealReason;
        AppealStatus status;
        uint256 filingDate;
        uint256 hearingDate;
        string[] appealDocumentsText; // Text-based appeal documents stored on-chain
    }

    enum VerdictType {
        GUILTY,
        NOT_GUILTY,
        DISMISSED,
        SETTLED,
        CONTINUED,
        OTHER
    }

    enum AppealStatus {
        FILED,
        UNDER_REVIEW,
        SCHEDULED,
        HEARD,
        GRANTED,
        DENIED,
        WITHDRAWN
    }

    // Events for transparency and immutability
    event VerdictRecorded(
        uint256 indexed caseId,
        uint256 indexed verdictId,
        address indexed judge,
        VerdictType verdictType,
        bool isFinal
    );
    event VerdictFinalized(uint256 indexed caseId, uint256 indexed verdictId);
    event AppealFiled(
        uint256 indexed appealId,
        uint256 indexed originalVerdictId,
        address indexed appellant,
        string reason
    );
    event AppealDecision(uint256 indexed appealId, AppealStatus status, string decisionDetails);

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
    ) external returns (uint256 verdictId);

    /**
     * @dev Finalize a verdict (mark as final and immutable)
     * @param verdictId The verdict identifier to finalize
     */
    function finalizeVerdict(uint256 verdictId) external;

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
    ) external returns (uint256 appealId);

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
    ) external;

    /**
     * @dev Schedule a hearing date for an appeal
     * @param appealId The appeal identifier
     * @param hearingDate The scheduled hearing date (timestamp)
     */
    function scheduleAppealHearing(uint256 appealId, uint256 hearingDate) external;

    // View functions for transparency
    /**
     * @dev Get verdict details by ID
     * @param verdictId The verdict identifier
     * @return Verdict struct with complete verdict information
     */
    function getVerdict(uint256 verdictId) external view returns (Verdict memory);

    /**
     * @dev Get all verdicts for a case
     * @param caseId The case identifier
     * @return Array of verdict IDs associated with the case
     */
    function getVerdictsByCase(uint256 caseId) external view returns (uint256[] memory);

    /**
     * @dev Get appeal details by ID
     * @param appealId The appeal identifier
     * @return Appeal struct with complete appeal information
     */
    function getAppeal(uint256 appealId) external view returns (Appeal memory);

    /**
     * @dev Get appeals for a specific verdict
     * @param verdictId The verdict identifier
     * @return Array of appeal IDs related to the verdict
     */
    function getAppealsByVerdict(uint256 verdictId) external view returns (uint256[] memory);

    /**
     * @dev Get verdicts issued by a specific judge
     * @param judge Address of the judge
     * @return Array of verdict IDs issued by the judge
     */
    function getVerdictsByJudge(address judge) external view returns (uint256[] memory);

    /**
     * @dev Get appeals filed by a specific appellant
     * @param appellant Address of the appellant
     * @return Array of appeal IDs filed by the appellant
     */
    function getAppealsByAppellant(address appellant) external view returns (uint256[] memory);

    /**
     * @dev Check if a verdict is final
     * @param verdictId The verdict identifier
     * @return True if verdict is final, false otherwise
     */
    function isVerdictFinal(uint256 verdictId) external view returns (bool);

    /**
     * @dev Get total number of verdicts recorded
     * @return Total verdict count
     */
    function getTotalVerdicts() external view returns (uint256);

    /**
     * @dev Get total number of appeals filed
     * @return Total appeal count
     */
    function getTotalAppeals() external view returns (uint256);
}