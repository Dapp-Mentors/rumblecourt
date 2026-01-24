// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ICaseRecording
 * @dev Interface for case recording functionality in the courtroom system
 * Ensures immutability through event logging and transparent case management
 */
interface ICaseRecording {
    // Structs
    struct Case {
        uint256 caseId;
        address plaintiff;
        address defendant;
        string caseType;
        string description;
        uint256 filingDate;
        CaseStatus status;
        uint256 lastUpdated;
        string[] evidenceText; // Text-based evidence stored on-chain
    }

    enum CaseStatus {
        FILED,
        UNDER_REVIEW,
        SCHEDULED,
        IN_PROGRESS,
        ADJOURNED,
        DECIDED,
        APPEALED,
        CLOSED
    }

    // Events for transparency and immutability
    event CaseFiled(uint256 indexed caseId, address indexed plaintiff, address indexed defendant, string caseType);
    event CaseUpdated(uint256 indexed caseId, CaseStatus oldStatus, CaseStatus newStatus);
    event EvidenceAdded(uint256 indexed caseId, string evidenceText, address indexed addedBy);
    event CaseDescriptionUpdated(uint256 indexed caseId, string newDescription);

    /**
     * @dev File a new case with initial details
     * @param defendant Address of the defendant
     * @param caseType Type/category of the case
     * @param description Detailed description of the case
     * @return caseId The unique identifier for the newly filed case
     */
    function fileCase(
        address defendant,
        string calldata caseType,
        string calldata description
    ) external returns (uint256 caseId);

    /**
     * @dev Update the status of an existing case
     * @param caseId The case identifier
     * @param newStatus The new status to set
     */
    function updateCaseStatus(uint256 caseId, CaseStatus newStatus) external;

    /**
     * @dev Add evidence to a case (stored as text on-chain for immutability)
     * @param caseId The case identifier
     * @param evidenceText Text content of the evidence
     */
    function addEvidence(uint256 caseId, string calldata evidenceText) external;

    /**
     * @dev Update case description (only by authorized parties)
     * @param caseId The case identifier
     * @param newDescription The updated description
     */
    function updateCaseDescription(uint256 caseId, string calldata newDescription) external;

    // View functions for transparency
    /**
     * @dev Get complete case details
     * @param caseId The case identifier
     * @return Case struct with all case information
     */
    function getCase(uint256 caseId) external view returns (Case memory);

    /**
     * @dev Get cases filed by a specific address
     * @param filer Address to query cases for
     * @return Array of case IDs
     */
    function getCasesByFiler(address filer) external view returns (uint256[] memory);

    /**
     * @dev Get cases by status
     * @param status Case status to filter by
     * @return Array of case IDs with the specified status
     */
    function getCasesByStatus(CaseStatus status) external view returns (uint256[] memory);

    /**
     * @dev Get total number of cases filed
     * @return Total case count
     */
    function getTotalCases() external view returns (uint256);

    /**
     * @dev Check if a case exists
     * @param caseId The case identifier
     * @return True if case exists, false otherwise
     */
    function caseExists(uint256 caseId) external view returns (bool);
}