// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ICourtSystem
 * @dev Interface defining the core entities and relationships in the courtroom system
 * Provides clear separation between Courts, Cases, and Participants with proper identifiers
 */
interface ICourtSystem {
    // Core Entity Identifiers
    struct Court {
        uint256 courtId;           // Unique court identifier
        address courtOwner;        // Account that owns this court
        string courtName;
        string courtDescription;
        uint256 createdAt;
        bool isActive;
    }

    struct Case {
        uint256 caseId;            // Unique case identifier
        uint256 courtId;           // Which court this case belongs to
        address plaintiff;
        address defendant;
        string caseType;
        string description;
        uint256 filingDate;
        CaseStatus status;
        uint256 lastUpdated;
    }

    struct Participant {
        uint256 participantId;     // Unique participant identifier
        address participantAddress;
        ParticipantRole role;
        string modelProvider;
        string modelId;
        string modelName;
        uint256 expertiseLevel;
        uint256 eloquenceScore;
        uint256 analyticalScore;
        uint256 emotionalIntelligence;
        string personalityTraits;
        bool isActive;
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

    enum ParticipantRole {
        JUDGE,
        PROSECUTOR,
        DEFENSE_ATTORNEY,
        CLERK,
        BAILIFF,
        JURY_MEMBER,
        WITNESS,
        APPELLANT,
        APPELLEE
    }

    // Events for transparency
    event CourtCreated(uint256 indexed courtId, address indexed courtOwner, string courtName);
    event CaseFiled(uint256 indexed caseId, uint256 indexed courtId, address indexed plaintiff, address defendant);
    event ParticipantAssigned(uint256 indexed courtId, uint256 indexed participantId, ParticipantRole role);

    /**
     * @dev Get court by ID
     * @param courtId The court identifier
     * @return Court struct
     */
    function getCourt(uint256 courtId) external view returns (Court memory);

    /**
     * @dev Get case by ID
     * @param caseId The case identifier
     * @return Case struct
     */
    function getCase(uint256 caseId) external view returns (Case memory);

    /**
     * @dev Get participant by ID
     * @param participantId The participant identifier
     * @return Participant struct
     */
    function getParticipant(uint256 participantId) external view returns (Participant memory);

    /**
     * @dev Get all cases for a court
     * @param courtId The court identifier
     * @return Array of case IDs
     */
    function getCasesByCourt(uint256 courtId) external view returns (uint256[] memory);

    /**
     * @dev Get all participants for a court
     * @param courtId The court identifier
     * @return Array of participant IDs
     */
    function getParticipantsByCourt(uint256 courtId) external view returns (uint256[] memory);

    /**
     * @dev Get court ID for a case
     * @param caseId The case identifier
     * @return courtId The court identifier
     */
    function getCourtIdForCase(uint256 caseId) external view returns (uint256);

    /**
     * @dev Get cases by status
     * @param status Case status to filter by
     * @return Array of case IDs
     */
    function getCasesByStatus(CaseStatus status) external view returns (uint256[] memory);

    /**
     * @dev Check if court exists
     * @param courtId The court identifier
     * @return True if court exists, false otherwise
     */
    function courtExists(uint256 courtId) external view returns (bool);

    /**
     * @dev Check if case exists
     * @param caseId The case identifier
     * @return True if case exists, false otherwise
     */
    function caseExists(uint256 caseId) external view returns (bool);

    /**
     * @dev Check if participant exists
     * @param participantId The participant identifier
     * @return True if participant exists, false otherwise
     */
    function participantExists(uint256 participantId) external view returns (bool);
}