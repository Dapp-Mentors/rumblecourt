// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ICourtSystem.sol";

/**
 * @title CourtroomParticipants
 * @dev Manages courtroom participants with different profiles and LLM model configurations
 * Each participant represents an LLM agent with specific characteristics and capabilities
 * Uses separate courtId and caseId for clear entity separation
 */
contract CourtroomParticipants is ICourtSystem {
    // Participant profile structure (separate from ICourtSystem Participant)
    struct ParticipantProfile {
        uint256 profileId;
        address participantAddress;
        ParticipantRole role;
        string modelProvider; // e.g., "openrouter", "anthropic", "google"
        string modelId; // e.g., "gpt-4", "claude-3-sonnet", "gemini-pro"
        string modelName; // Human-readable name
        uint256 expertiseLevel; // 1-10 scale
        uint256 eloquenceScore; // 1-10 scale
        uint256 analyticalScore; // 1-10 scale
        uint256 emotionalIntelligence; // 1-10 scale
        string personalityTraits; // JSON string with personality attributes
        bool isActive;
        uint256 createdAt;
        uint256 lastUpdated;
    }

    // Court participant assignment
    struct CourtParticipant {
        uint256 courtId;
        uint256 profileId;
        ParticipantRole role;
        bool isActive;
        uint256 assignedAt;
        uint256 lastActivity;
    }

    // State variables
    mapping(uint256 => ParticipantProfile) private _profiles;
    mapping(address => uint256[]) private _addressProfiles;
    mapping(uint256 => Court) private _courts;
    mapping(uint256 => CourtParticipant[]) private _courtParticipants;
    mapping(uint256 => mapping(ParticipantRole => uint256)) private _courtRoleCounts;
    mapping(address => uint256) private _ownerToCourtId; // Maps owner address to their court ID
    
    uint256 private _nextProfileId = 1;
    uint256 private _nextCourtId = 1;
    
    address private _contractOwner;

    // Events
    event ProfileCreated(
        uint256 indexed profileId,
        address indexed participantAddress,
        ParticipantRole role,
        string modelProvider,
        string modelId,
        string modelName
    );
    
    event ProfileUpdated(
        uint256 indexed profileId,
        ParticipantRole role,
        uint256 expertiseLevel,
        uint256 eloquenceScore
    );
    
    event ProfileDeactivated(uint256 indexed profileId);
    
    event CourtActivated(uint256 indexed courtId);
    event CourtDeactivated(uint256 indexed courtId);
    
    event ParticipantRemoved(
        uint256 indexed courtId,
        uint256 indexed profileId,
        ParticipantRole role
    );

    modifier onlyContractOwner() {
        require(msg.sender == _contractOwner, "Only contract owner can perform this action");
        _;
    }

    modifier onlyCourtOwner(uint256 courtId) {
        require(_courts[courtId].courtOwner == msg.sender, "Only court owner can perform this action");
        _;
    }

    modifier profileExists(uint256 profileId) {
        require(_profiles[profileId].profileId != 0, "Profile does not exist");
        _;
    }

    modifier courtExistsCheck(uint256 courtId) {
        require(_courts[courtId].courtId != 0, "Court does not exist");
        _;
    }

    constructor() {
        _contractOwner = msg.sender;
    }

    /**
     * @dev Create a new participant profile
     * @param participantAddress The address of the participant
     * @param role The role of the participant
     * @param modelProvider The LLM model provider (e.g., "openrouter", "anthropic")
     * @param modelId The specific model ID (e.g., "gpt-4", "claude-3-sonnet")
     * @param modelName The human-readable model name
     * @param expertiseLevel Expertise level (1-10)
     * @param eloquenceScore Eloquence score (1-10)
     * @param analyticalScore Analytical score (1-10)
     * @param emotionalIntelligence Emotional intelligence score (1-10)
     * @param personalityTraits JSON string with personality attributes
     * @return profileId The unique identifier for the created profile
     */
    function createParticipantProfile(
        address participantAddress,
        ParticipantRole role,
        string calldata modelProvider,
        string calldata modelId,
        string calldata modelName,
        uint256 expertiseLevel,
        uint256 eloquenceScore,
        uint256 analyticalScore,
        uint256 emotionalIntelligence,
        string calldata personalityTraits
    ) external onlyContractOwner returns (uint256 profileId) {
        require(expertiseLevel > 0 && expertiseLevel <= 10, "Expertise level must be 1-10");
        require(eloquenceScore > 0 && eloquenceScore <= 10, "Eloquence score must be 1-10");
        require(analyticalScore > 0 && analyticalScore <= 10, "Analytical score must be 1-10");
        require(emotionalIntelligence > 0 && emotionalIntelligence <= 10, "Emotional intelligence must be 1-10");
        
        profileId = _nextProfileId++;
        
        _profiles[profileId] = ParticipantProfile({
            profileId: profileId,
            participantAddress: participantAddress,
            role: role,
            modelProvider: modelProvider,
            modelId: modelId,
            modelName: modelName,
            expertiseLevel: expertiseLevel,
            eloquenceScore: eloquenceScore,
            analyticalScore: analyticalScore,
            emotionalIntelligence: emotionalIntelligence,
            personalityTraits: personalityTraits,
            isActive: true,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        _addressProfiles[participantAddress].push(profileId);

        emit ProfileCreated(profileId, participantAddress, role, modelProvider, modelId, modelName);
    }

    /**
     * @dev Update an existing participant profile
     * @param profileId The profile identifier
     * @param role The updated role
     * @param expertiseLevel Updated expertise level (1-10)
     * @param eloquenceScore Updated eloquence score (1-10)
     * @param analyticalScore Updated analytical score (1-10)
     * @param emotionalIntelligence Updated emotional intelligence score (1-10)
     * @param personalityTraits Updated personality traits JSON
     */
    function updateParticipantProfile(
        uint256 profileId,
        ParticipantRole role,
        uint256 expertiseLevel,
        uint256 eloquenceScore,
        uint256 analyticalScore,
        uint256 emotionalIntelligence,
        string calldata personalityTraits
    ) external onlyContractOwner profileExists(profileId) {
        require(expertiseLevel > 0 && expertiseLevel <= 10, "Expertise level must be 1-10");
        require(eloquenceScore > 0 && eloquenceScore <= 10, "Eloquence score must be 1-10");
        require(analyticalScore > 0 && analyticalScore <= 10, "Analytical score must be 1-10");
        require(emotionalIntelligence > 0 && emotionalIntelligence <= 10, "Emotional intelligence must be 1-10");

        ParticipantProfile storage profile = _profiles[profileId];
        profile.role = role;
        profile.expertiseLevel = expertiseLevel;
        profile.eloquenceScore = eloquenceScore;
        profile.analyticalScore = analyticalScore;
        profile.emotionalIntelligence = emotionalIntelligence;
        profile.personalityTraits = personalityTraits;
        profile.lastUpdated = block.timestamp;

        emit ProfileUpdated(profileId, role, expertiseLevel, eloquenceScore);
    }

    /**
     * @dev Deactivate a participant profile
     * @param profileId The profile identifier
     */
    function deactivateParticipantProfile(uint256 profileId) external onlyContractOwner profileExists(profileId) {
        _profiles[profileId].isActive = false;
        _profiles[profileId].lastUpdated = block.timestamp;
        
        emit ProfileDeactivated(profileId);
    }

    /**
     * @dev Check if an address already has a court
     * @param owner The address to check
     * @return True if the address already has a court, false otherwise
     */
    function hasCourt(address owner) external view returns (bool) {
        uint256 courtId = _ownerToCourtId[owner];
        return courtId != 0 && _courts[courtId].courtId != 0;
    }

    /**
     * @dev Get court ID for an owner
     * @param owner The owner address
     * @return courtId The court ID, or 0 if no court exists
     */
    function getCourtIdByOwner(address owner) external view returns (uint256) {
        return _ownerToCourtId[owner];
    }

    /**
     * @dev Create a new court
     * @param courtName The name of the court
     * @param courtDescription Description of the court
     * @return courtId The unique identifier for the created court
     */
    function createCourt(
        string calldata courtName,
        string calldata courtDescription
    ) external returns (uint256 courtId) {
        require(_ownerToCourtId[msg.sender] == 0, "Account already has a court");
        
        courtId = _nextCourtId++;
        
        _courts[courtId] = Court({
            courtId: courtId,
            courtOwner: msg.sender,
            courtName: courtName,
            courtDescription: courtDescription,
            isActive: true,
            createdAt: block.timestamp
        });

        // Map the owner to this court
        _ownerToCourtId[msg.sender] = courtId;

        emit CourtCreated(courtId, msg.sender, courtName);
    }

    /**
     * @dev Activate a court
     * @param courtId The court identifier
     */
    function activateCourt(uint256 courtId) external onlyCourtOwner(courtId) courtExistsCheck(courtId) {
        _courts[courtId].isActive = true;
        emit CourtActivated(courtId);
    }

    /**
     * @dev Deactivate a court
     * @param courtId The court identifier
     */
    function deactivateCourt(uint256 courtId) external onlyCourtOwner(courtId) courtExistsCheck(courtId) {
        _courts[courtId].isActive = false;
        emit CourtDeactivated(courtId);
    }

    /**
     * @dev Assign a participant to a court
     * @param courtId The court identifier
     * @param profileId The participant profile identifier
     * @param role The role to assign in the court
     */
    function assignParticipantToCourt(
        uint256 courtId,
        uint256 profileId,
        ParticipantRole role
    ) external onlyCourtOwner(courtId) courtExistsCheck(courtId) profileExists(profileId) {
        require(_profiles[profileId].isActive, "Profile must be active");
        require(_courts[courtId].isActive, "Court must be active");
        
        // Check if participant is already assigned to this court
        CourtParticipant[] storage participants = _courtParticipants[courtId];
        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i].profileId == profileId) {
                require(!participants[i].isActive, "Participant already assigned to this court");
                participants[i].role = role;
                participants[i].isActive = true;
                participants[i].lastActivity = block.timestamp;
                _courtRoleCounts[courtId][role]++;
                emit ParticipantAssigned(courtId, profileId, role);
                return;
            }
        }

        // Add new participant
        participants.push(CourtParticipant({
            courtId: courtId,
            profileId: profileId,
            role: role,
            isActive: true,
            assignedAt: block.timestamp,
            lastActivity: block.timestamp
        }));

        _courtRoleCounts[courtId][role]++;
        
        emit ParticipantAssigned(courtId, profileId, role);
    }

    /**
     * @dev Remove a participant from a court
     * @param courtId The court identifier
     * @param profileId The participant profile identifier
     */
    function removeParticipantFromCourt(
        uint256 courtId,
        uint256 profileId
    ) external onlyCourtOwner(courtId) courtExistsCheck(courtId) {
        CourtParticipant[] storage participants = _courtParticipants[courtId];
        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i].profileId == profileId && participants[i].isActive) {
                ParticipantRole role = participants[i].role;
                participants[i].isActive = false;
                participants[i].lastActivity = block.timestamp;
                _courtRoleCounts[courtId][role]--;
                
                emit ParticipantRemoved(courtId, profileId, role);
                return;
            }
        }
        revert("Participant not found in court");
    }

    // View functions

    /**
     * @dev Get participant profile by ID
     * @param profileId The profile identifier
     * @return ParticipantProfile struct
     */
    function getParticipantProfile(uint256 profileId) external view profileExists(profileId) returns (ParticipantProfile memory) {
        return _profiles[profileId];
    }

    /**
     * @dev Get all profiles for an address
     * @param participantAddress The participant address
     * @return Array of profile IDs
     */
    function getProfilesByAddress(address participantAddress) external view returns (uint256[] memory) {
        return _addressProfiles[participantAddress];
    }

    /**
     * @dev Get all participants in a court
     * @param courtId The court identifier
     * @return Array of CourtParticipant structs
     */
    function getCourtParticipants(uint256 courtId) external view courtExistsCheck(courtId) returns (CourtParticipant[] memory) {
        return _courtParticipants[courtId];
    }

    /**
     * @dev Get participants by role in a court
     * @param courtId The court identifier
     * @param role The participant role
     * @return Array of profile IDs with the specified role
     */
    function getCourtParticipantsByRole(uint256 courtId, ParticipantRole role) external view courtExistsCheck(courtId) returns (uint256[] memory) {
        CourtParticipant[] storage participants = _courtParticipants[courtId];
        uint256[] memory roleParticipants = new uint256[](participants.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i].role == role && participants[i].isActive) {
                roleParticipants[count++] = participants[i].profileId;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = roleParticipants[i];
        }
        
        return result;
    }

    /**
     * @dev Get participant count by role in a court
     * @param courtId The court identifier
     * @param role The participant role
     * @return Count of participants with the specified role
     */
    function getCourtParticipantCountByRole(uint256 courtId, ParticipantRole role) external view courtExistsCheck(courtId) returns (uint256) {
        return _courtRoleCounts[courtId][role];
    }

    /**
     * @dev Get total number of profiles
     * @return Total profile count
     */
    function getTotalProfiles() external view returns (uint256) {
        return _nextProfileId - 1;
    }

    /**
     * @dev Get total number of courts
     * @return Total court count
     */
    function getTotalCourts() external view returns (uint256) {
        return _nextCourtId - 1;
    }

    /**
     * @dev Get contract owner
     * @return Contract owner address
     */
    function getContractOwner() external view returns (address) {
        return _contractOwner;
    }

    /**
     * @dev Check if a court has all required roles filled
     * @param courtId The court identifier
     * @return True if court has complete roster, false otherwise
     */
    function isCourtComplete(uint256 courtId) external view courtExistsCheck(courtId) returns (bool) {
        CourtParticipant[] storage participants = _courtParticipants[courtId];
        bool hasJudge = false;
        bool hasProsecutor = false;
        bool hasDefense = false;
        bool hasClerk = false;
        
        for (uint256 i = 0; i < participants.length; i++) {
            if (!participants[i].isActive) continue;
            
            ParticipantRole role = participants[i].role;
            if (role == ParticipantRole.JUDGE) hasJudge = true;
            else if (role == ParticipantRole.PROSECUTOR) hasProsecutor = true;
            else if (role == ParticipantRole.DEFENSE_ATTORNEY) hasDefense = true;
            else if (role == ParticipantRole.CLERK) hasClerk = true;
        }
        
        return hasJudge && hasProsecutor && hasDefense && hasClerk;
    }

    // ICourtSystem interface implementations

    /**
     * @dev Get court by ID (ICourtSystem interface)
     * @param courtId The court identifier
     * @return Court struct
     */
    function getCourt(uint256 courtId) external view override courtExistsCheck(courtId) returns (Court memory) {
        return _courts[courtId];
    }

    /**
     * @dev Get case by ID (ICourtSystem interface)
     * @param caseId The case identifier
     * @return Case struct (returns empty case for now, to be implemented in CaseRecording contract)
     */
    function getCase(uint256 caseId) external view override returns (Case memory) {
        // This will be implemented in the CaseRecording contract
        // For now, return an empty case to satisfy the interface
        return Case({
            caseId: 0,
            courtId: 0,
            plaintiff: address(0),
            defendant: address(0),
            caseType: "",
            description: "",
            filingDate: 0,
            status: CaseStatus.FILED,
            lastUpdated: 0
        });
    }

    /**
     * @dev Get participant by ID (ICourtSystem interface)
     * @param participantId The participant identifier
     * @return Participant struct
     */
    function getParticipant(uint256 participantId) external view override returns (Participant memory) {
        ParticipantProfile memory profile = _profiles[participantId];
        return Participant({
            participantId: profile.profileId,
            participantAddress: profile.participantAddress,
            role: profile.role,
            modelProvider: profile.modelProvider,
            modelId: profile.modelId,
            modelName: profile.modelName,
            expertiseLevel: profile.expertiseLevel,
            eloquenceScore: profile.eloquenceScore,
            analyticalScore: profile.analyticalScore,
            emotionalIntelligence: profile.emotionalIntelligence,
            personalityTraits: profile.personalityTraits,
            isActive: profile.isActive
        });
    }

    /**
     * @dev Get all cases for a court (ICourtSystem interface)
     * @param courtId The court identifier
     * @return Array of case IDs (returns empty array for now, to be implemented in CaseRecording contract)
     */
    function getCasesByCourt(uint256 courtId) external view override returns (uint256[] memory) {
        // This will be implemented in the CaseRecording contract
        // For now, return an empty array to satisfy the interface
        return new uint256[](0);
    }

    /**
     * @dev Get all participants for a court (ICourtSystem interface)
     * @param courtId The court identifier
     * @return Array of participant IDs
     */
    function getParticipantsByCourt(uint256 courtId) external view override returns (uint256[] memory) {
        CourtParticipant[] storage participants = _courtParticipants[courtId];
        uint256[] memory participantIds = new uint256[](participants.length);
        
        for (uint256 i = 0; i < participants.length; i++) {
            participantIds[i] = participants[i].profileId;
        }
        
        return participantIds;
    }

    /**
     * @dev Get court ID for a case (ICourtSystem interface)
     * @param caseId The case identifier
     * @return courtId The court identifier (returns 0 for now, to be implemented in CaseRecording contract)
     */
    function getCourtIdForCase(uint256 caseId) external view override returns (uint256) {
        // This will be implemented in the CaseRecording contract
        // For now, return 0 to satisfy the interface
        return 0;
    }

    /**
     * @dev Get cases by status (ICourtSystem interface)
     * @param status Case status to filter by
     * @return Array of case IDs (returns empty array for now, to be implemented in CaseRecording contract)
     */
    function getCasesByStatus(CaseStatus status) external view override returns (uint256[] memory) {
        // This will be implemented in the CaseRecording contract
        // For now, return an empty array to satisfy the interface
        return new uint256[](0);
    }

    /**
     * @dev Check if case exists (ICourtSystem interface)
     * @param caseId The case identifier
     * @return True if case exists, false otherwise (returns false for now, to be implemented in CaseRecording contract)
     */
    function caseExists(uint256 caseId) external view override returns (bool) {
        // This will be implemented in the CaseRecording contract
        // For now, return false to satisfy the interface
        return false;
    }

    /**
     * @dev Check if participant exists (ICourtSystem interface)
     * @param participantId The participant identifier
     * @return True if participant exists, false otherwise
     */
    function participantExists(uint256 participantId) external view override returns (bool) {
        return _profiles[participantId].profileId != 0;
    }

    /**
     * @dev Check if court exists (ICourtSystem interface)
     * @param courtId The court identifier
     * @return True if court exists, false otherwise
     */
    function courtExists(uint256 courtId) external view override returns (bool) {
        return _courts[courtId].courtId != 0;
    }
}
