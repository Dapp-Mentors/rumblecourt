// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IAdjournmentTracking.sol";

/**
 * @title AdjournmentTracking
 * @dev Implementation of adjournment tracking and management for the courtroom system
 * Ensures immutability through comprehensive event logging and transparent adjournment scheduling
 */
contract AdjournmentTracking is IAdjournmentTracking {
    // State variables
    mapping(uint256 => Adjournment) private _adjournments;
    mapping(uint256 => uint256[]) private _caseAdjournmentIds;
    mapping(address => uint256[]) private _requesterAdjournmentIds;
    mapping(AdjournmentStatus => uint256[]) private _statusAdjournmentIds;

    uint256 private _nextAdjournmentId = 1;

    // Access control - only judges can approve/deny/manage adjournments
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
    ) external returns (uint256 adjournmentId) {
        require(requestedNewDate > block.timestamp, "Requested date must be in the future");

        adjournmentId = _nextAdjournmentId++;

        _adjournments[adjournmentId] = Adjournment({
            adjournmentId: adjournmentId,
            caseId: caseId,
            requestedBy: msg.sender,
            reason: reason,
            reasonDetails: reasonDetails,
            originalHearingDate: 0, // To be set during approval
            newHearingDate: requestedNewDate,
            status: AdjournmentStatus.REQUESTED,
            requestDate: block.timestamp,
            approvalDate: 0,
            approvedBy: address(0),
            supportingDocumentsText: supportingDocumentsText
        });

        _caseAdjournmentIds[caseId].push(adjournmentId);
        _requesterAdjournmentIds[msg.sender].push(adjournmentId);
        _statusAdjournmentIds[AdjournmentStatus.REQUESTED].push(adjournmentId);

        emit AdjournmentRequested(adjournmentId, caseId, msg.sender, reason);
    }

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
    ) external onlyAuthorizedJudge {
        require(_adjournments[adjournmentId].adjournmentId != 0, "Adjournment does not exist");
        require(_adjournments[adjournmentId].status == AdjournmentStatus.REQUESTED, "Adjournment must be in REQUESTED status");
        require(approvedNewDate > block.timestamp, "Approved date must be in the future");

        uint256 caseId = _adjournments[adjournmentId].caseId;

        // Update status arrays
        _removeFromStatusArray(AdjournmentStatus.REQUESTED, adjournmentId);
        _statusAdjournmentIds[AdjournmentStatus.APPROVED].push(adjournmentId);

        _adjournments[adjournmentId].status = AdjournmentStatus.APPROVED;
        _adjournments[adjournmentId].newHearingDate = approvedNewDate;
        _adjournments[adjournmentId].approvalDate = block.timestamp;
        _adjournments[adjournmentId].approvedBy = msg.sender;

        emit AdjournmentApproved(adjournmentId, caseId, msg.sender, approvedNewDate);

        // If there's an original hearing date, emit hearing rescheduled event
        if (_adjournments[adjournmentId].originalHearingDate > 0) {
            emit HearingRescheduled(
                caseId,
                _adjournments[adjournmentId].originalHearingDate,
                approvedNewDate,
                approvalNotes
            );
        }
    }

    /**
     * @dev Deny an adjournment request
     * @param adjournmentId The adjournment request identifier
     * @param denialReason Reason for denying the adjournment
     */
    function denyAdjournment(uint256 adjournmentId, string calldata denialReason) external onlyAuthorizedJudge {
        require(_adjournments[adjournmentId].adjournmentId != 0, "Adjournment does not exist");
        require(_adjournments[adjournmentId].status == AdjournmentStatus.REQUESTED, "Adjournment must be in REQUESTED status");

        uint256 caseId = _adjournments[adjournmentId].caseId;

        // Update status arrays
        _removeFromStatusArray(AdjournmentStatus.REQUESTED, adjournmentId);
        _statusAdjournmentIds[AdjournmentStatus.DENIED].push(adjournmentId);

        _adjournments[adjournmentId].status = AdjournmentStatus.DENIED;
        _adjournments[adjournmentId].approvalDate = block.timestamp;
        _adjournments[adjournmentId].approvedBy = msg.sender;

        emit AdjournmentDenied(adjournmentId, caseId, msg.sender, denialReason);
    }

    /**
     * @dev Cancel an approved adjournment
     * @param adjournmentId The adjournment identifier
     * @param cancellationReason Reason for cancelling the adjournment
     */
    function cancelAdjournment(uint256 adjournmentId, string calldata cancellationReason) external onlyAuthorizedJudge {
        require(_adjournments[adjournmentId].adjournmentId != 0, "Adjournment does not exist");
        require(_adjournments[adjournmentId].status == AdjournmentStatus.APPROVED, "Adjournment must be in APPROVED status");

        uint256 caseId = _adjournments[adjournmentId].caseId;

        // Update status arrays
        _removeFromStatusArray(AdjournmentStatus.APPROVED, adjournmentId);
        _statusAdjournmentIds[AdjournmentStatus.CANCELLED].push(adjournmentId);

        _adjournments[adjournmentId].status = AdjournmentStatus.CANCELLED;

        emit AdjournmentCancelled(adjournmentId, caseId, cancellationReason);
    }

    /**
     * @dev Mark an adjournment as completed (hearing rescheduled successfully)
     * @param adjournmentId The adjournment identifier
     */
    function completeAdjournment(uint256 adjournmentId) external onlyAuthorizedJudge {
        require(_adjournments[adjournmentId].adjournmentId != 0, "Adjournment does not exist");
        require(_adjournments[adjournmentId].status == AdjournmentStatus.APPROVED, "Adjournment must be in APPROVED status");

        // Update status arrays
        _removeFromStatusArray(AdjournmentStatus.APPROVED, adjournmentId);
        _statusAdjournmentIds[AdjournmentStatus.COMPLETED].push(adjournmentId);

        _adjournments[adjournmentId].status = AdjournmentStatus.COMPLETED;
    }

    /**
     * @dev Update the hearing date for a case (emergency rescheduling)
     * @param caseId The case identifier
     * @param newHearingDate The new hearing date (timestamp)
     * @param reason Reason for the emergency rescheduling
     */
    function emergencyReschedule(uint256 caseId, uint256 newHearingDate, string calldata reason) external onlyAuthorizedJudge {
        require(newHearingDate > block.timestamp, "New hearing date must be in the future");

        // Find the most recent approved adjournment for this case to update original date
        uint256[] memory caseAdjournmentIds = _caseAdjournmentIds[caseId];
        uint256 originalDate = 0;

        for (uint256 i = caseAdjournmentIds.length; i > 0; i--) {
            uint256 adjId = caseAdjournmentIds[i - 1];
            if (_adjournments[adjId].status == AdjournmentStatus.APPROVED ||
                _adjournments[adjId].status == AdjournmentStatus.COMPLETED) {
                originalDate = _adjournments[adjId].newHearingDate;
                _adjournments[adjId].originalHearingDate = originalDate; // Update for tracking
                break;
            }
        }

        emit HearingRescheduled(caseId, originalDate, newHearingDate, reason);
    }

    // Helper function to remove adjournment ID from status array
    function _removeFromStatusArray(AdjournmentStatus status, uint256 adjournmentId) private {
        uint256[] storage statusArray = _statusAdjournmentIds[status];
        for (uint256 i = 0; i < statusArray.length; i++) {
            if (statusArray[i] == adjournmentId) {
                statusArray[i] = statusArray[statusArray.length - 1];
                statusArray.pop();
                break;
            }
        }
    }

    // View functions for transparency

    /**
     * @dev Get adjournment details by ID
     * @param adjournmentId The adjournment identifier
     * @return Adjournment struct with complete adjournment information
     */
    function getAdjournment(uint256 adjournmentId) external view returns (Adjournment memory) {
        require(_adjournments[adjournmentId].adjournmentId != 0, "Adjournment does not exist");
        return _adjournments[adjournmentId];
    }

    /**
     * @dev Get all adjournments for a case
     * @param caseId The case identifier
     * @return Array of adjournment IDs associated with the case
     */
    function getAdjournamentsByCase(uint256 caseId) external view returns (uint256[] memory) {
        return _caseAdjournmentIds[caseId];
    }

    /**
     * @dev Get adjournments requested by a specific address
     * @param requester Address of the requester
     * @return Array of adjournment IDs requested by the address
     */
    function getAdjournamentsByRequester(address requester) external view returns (uint256[] memory) {
        return _requesterAdjournmentIds[requester];
    }

    /**
     * @dev Get adjournments by status
     * @param status Adjournment status to filter by
     * @return Array of adjournment IDs with the specified status
     */
    function getAdjournamentsByStatus(AdjournmentStatus status) external view returns (uint256[] memory) {
        return _statusAdjournmentIds[status];
    }

    /**
     * @dev Get pending adjournment requests for a case
     * @param caseId The case identifier
     * @return Array of pending adjournment IDs
     */
    function getPendingAdjournmentRequests(uint256 caseId) external view returns (uint256[] memory) {
        uint256[] memory caseAdjournmentIds = _caseAdjournmentIds[caseId];
        uint256[] memory pending = new uint256[](caseAdjournmentIds.length);
        uint256 count = 0;

        for (uint256 i = 0; i < caseAdjournmentIds.length; i++) {
            if (_adjournments[caseAdjournmentIds[i]].status == AdjournmentStatus.REQUESTED ||
                _adjournments[caseAdjournmentIds[i]].status == AdjournmentStatus.UNDER_REVIEW) {
                pending[count] = caseAdjournmentIds[i];
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pending[i];
        }

        return result;
    }

    /**
     * @dev Check if a case has any active adjournments
     * @param caseId The case identifier
     * @return True if case has active adjournments, false otherwise
     */
    function hasActiveAdjournment(uint256 caseId) external view returns (bool) {
        uint256[] memory caseAdjournmentIds = _caseAdjournmentIds[caseId];

        for (uint256 i = 0; i < caseAdjournmentIds.length; i++) {
            AdjournmentStatus status = _adjournments[caseAdjournmentIds[i]].status;
            if (status == AdjournmentStatus.APPROVED || status == AdjournmentStatus.UNDER_REVIEW) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Get the next scheduled hearing date for a case (considering adjournments)
     * @param caseId The case identifier
     * @return The next hearing date timestamp, or 0 if no hearing scheduled
     */
    function getNextHearingDate(uint256 caseId) external view returns (uint256) {
        uint256[] memory caseAdjournmentIds = _caseAdjournmentIds[caseId];
        uint256 latestApprovedDate = 0;

        for (uint256 i = 0; i < caseAdjournmentIds.length; i++) {
            uint256 adjId = caseAdjournmentIds[i];
            AdjournmentStatus status = _adjournments[adjId].status;
            if ((status == AdjournmentStatus.APPROVED || status == AdjournmentStatus.COMPLETED) &&
                _adjournments[adjId].newHearingDate > latestApprovedDate) {
                latestApprovedDate = _adjournments[adjId].newHearingDate;
            }
        }

        return latestApprovedDate;
    }

    /**
     * @dev Get adjournments within a date range
     * @param startDate Start of the date range (timestamp)
     * @param endDate End of the date range (timestamp)
     * @return Array of adjournment IDs within the date range
     */
    function getAdjournamentsInDateRange(uint256 startDate, uint256 endDate) external view returns (uint256[] memory) {
        uint256 totalAdjournmentIds = _nextAdjournmentId - 1;
        uint256[] memory tempResults = new uint256[](totalAdjournmentIds);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalAdjournmentIds; i++) {
            uint256 requestDate = _adjournments[i].requestDate;
            if (requestDate >= startDate && requestDate <= endDate) {
                tempResults[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempResults[i];
        }

        return result;
    }

    /**
     * @dev Get total number of adjournment requests
     * @return Total adjournment count
     */
    function getTotalAdjournmentRequests() external view returns (uint256) {
        return _nextAdjournmentId - 1;
    }

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
    ) {
        approved = _statusAdjournmentIds[AdjournmentStatus.APPROVED].length +
                  _statusAdjournmentIds[AdjournmentStatus.COMPLETED].length;
        denied = _statusAdjournmentIds[AdjournmentStatus.DENIED].length;
        pending = _statusAdjournmentIds[AdjournmentStatus.REQUESTED].length +
                 _statusAdjournmentIds[AdjournmentStatus.UNDER_REVIEW].length;
    }
}