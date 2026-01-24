// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IAdjournmentTracking
 * @dev Interface for adjournment tracking and management in the courtroom system
 * Ensures immutability through event logging and transparent adjournment scheduling
 */
interface IAdjournmentTracking {
    // Structs
    struct Adjournment {
        uint256 adjournmentId;
        uint256 caseId;
        address requestedBy;
        AdjournmentReason reason;
        string reasonDetails;
        uint256 originalHearingDate;
        uint256 newHearingDate;
        AdjournmentStatus status;
        uint256 requestDate;
        uint256 approvalDate;
        address approvedBy;
        string[] supportingDocumentsText; // Text-based supporting documents stored on-chain
    }

    enum AdjournmentReason {
        JUDGE_UNAVAILABLE,
        PARTY_UNAVAILABLE,
        EVIDENCE_PENDING,
        LEGAL_RESEARCH,
        SETTLEMENT_DISCUSSIONS,
        MEDICAL_EMERGENCY,
        TECHNICAL_ISSUES,
        OTHER
    }

    enum AdjournmentStatus {
        REQUESTED,
        UNDER_REVIEW,
        APPROVED,
        DENIED,
        CANCELLED,
        COMPLETED
    }

    // Events for transparency and immutability
    event AdjournmentRequested(
        uint256 indexed adjournmentId,
        uint256 indexed caseId,
        address indexed requestedBy,
        AdjournmentReason reason
    );
    event AdjournmentApproved(
        uint256 indexed adjournmentId,
        uint256 indexed caseId,
        address indexed approvedBy,
        uint256 newHearingDate
    );
    event AdjournmentDenied(
        uint256 indexed adjournmentId,
        uint256 indexed caseId,
        address indexed deniedBy,
        string denialReason
    );
    event AdjournmentCancelled(uint256 indexed adjournmentId, uint256 indexed caseId, string cancellationReason);
    event HearingRescheduled(uint256 indexed caseId, uint256 oldDate, uint256 newDate, string reason);

    /**
     * @dev Request an adjournment for a case hearing
     * @param caseId The case identifier
     * @param reason The reason for adjournment
     * @param reasonDetails Detailed explanation of the adjournment reason
     * @param requestedNewDate The requested new hearing date (timestamp)
     * @param supportingDocumentsText Text-based supporting documents
     * @return adjournmentId The unique identifier for the adjournment request
     */
    function requestAdjournment(
        uint256 caseId,
        AdjournmentReason reason,
        string calldata reasonDetails,
        uint256 requestedNewDate,
        string[] calldata supportingDocumentsText
    ) external returns (uint256 adjournmentId);

    /**
     * @dev Approve an adjournment request
     * @param adjournmentId The adjournment request identifier
     * @param approvedNewDate The approved new hearing date (timestamp)
     * @param approvalNotes Additional notes from the approver
     */
    function approveAdjournment(
        uint256 adjournmentId,
        uint256 approvedNewDate,
        string calldata approvalNotes
    ) external;

    /**
     * @dev Deny an adjournment request
     * @param adjournmentId The adjournment request identifier
     * @param denialReason Reason for denying the adjournment
     */
    function denyAdjournment(uint256 adjournmentId, string calldata denialReason) external;

    /**
     * @dev Cancel an approved adjournment
     * @param adjournmentId The adjournment identifier
     * @param cancellationReason Reason for cancelling the adjournment
     */
    function cancelAdjournment(uint256 adjournmentId, string calldata cancellationReason) external;

    /**
     * @dev Mark an adjournment as completed (hearing rescheduled successfully)
     * @param adjournmentId The adjournment identifier
     */
    function completeAdjournment(uint256 adjournmentId) external;

    /**
     * @dev Update the hearing date for a case (emergency rescheduling)
     * @param caseId The case identifier
     * @param newHearingDate The new hearing date (timestamp)
     * @param reason Reason for the emergency rescheduling
     */
    function emergencyReschedule(uint256 caseId, uint256 newHearingDate, string calldata reason) external;

    // View functions for transparency
    /**
     * @dev Get adjournment details by ID
     * @param adjournmentId The adjournment identifier
     * @return Adjournment struct with complete adjournment information
     */
    function getAdjournment(uint256 adjournmentId) external view returns (Adjournment memory);

    /**
     * @dev Get all adjournments for a case
     * @param caseId The case identifier
     * @return Array of adjournment IDs associated with the case
     */
    function getAdjournamentsByCase(uint256 caseId) external view returns (uint256[] memory);

    /**
     * @dev Get adjournments requested by a specific address
     * @param requester Address of the requester
     * @return Array of adjournment IDs requested by the address
     */
    function getAdjournamentsByRequester(address requester) external view returns (uint256[] memory);

    /**
     * @dev Get adjournments by status
     * @param status Adjournment status to filter by
     * @return Array of adjournment IDs with the specified status
     */
    function getAdjournamentsByStatus(AdjournmentStatus status) external view returns (uint256[] memory);

    /**
     * @dev Get pending adjournment requests for a case
     * @param caseId The case identifier
     * @return Array of pending adjournment IDs
     */
    function getPendingAdjournmentRequests(uint256 caseId) external view returns (uint256[] memory);

    /**
     * @dev Check if a case has any active adjournments
     * @param caseId The case identifier
     * @return True if case has active adjournments, false otherwise
     */
    function hasActiveAdjournment(uint256 caseId) external view returns (bool);

    /**
     * @dev Get the next scheduled hearing date for a case (considering adjournments)
     * @param caseId The case identifier
     * @return The next hearing date timestamp, or 0 if no hearing scheduled
     */
    function getNextHearingDate(uint256 caseId) external view returns (uint256);

    /**
     * @dev Get adjournments within a date range
     * @param startDate Start of the date range (timestamp)
     * @param endDate End of the date range (timestamp)
     * @return Array of adjournment IDs within the date range
     */
    function getAdjournamentsInDateRange(uint256 startDate, uint256 endDate) external view returns (uint256[] memory);

    /**
     * @dev Get total number of adjournment requests
     * @return Total adjournment count
     */
    function getTotalAdjournmentRequests() external view returns (uint256);

    /**
     * @dev Get adjournment statistics
     * @return approved Total approved adjournments
     * @return denied Total denied adjournments
     * @return pending Total pending adjournments
     */
    function getAdjournmentStatistics() external view returns (
        uint256 approved,
        uint256 denied,
        uint256 pending
    );
}