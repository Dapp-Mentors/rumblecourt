import { expect } from 'chai'
import hre from 'hardhat'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import type { CourtroomParticipants } from '../typechain-types'

describe('CourtroomParticipants', function () {
  let courtroomParticipants: CourtroomParticipants
  let contractOwner: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let courtOwner: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let participant1: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let participant2: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let participant3: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let participant4: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let participant5: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]

  beforeEach(async function () {
    ;[contractOwner, courtOwner, participant1, participant2, participant3, participant4, participant5] = await hre.ethers.getSigners()

    const CourtroomParticipantsFactory = await hre.ethers.getContractFactory(
      'CourtroomParticipants',
      contractOwner
    )
    courtroomParticipants = (await CourtroomParticipantsFactory.deploy()) as CourtroomParticipants
    await courtroomParticipants.waitForDeployment()
  })

  describe('Deployment', function () {
    it('Should deploy successfully', async function () {
      expect(await courtroomParticipants.getAddress()).to.not.equal(
        hre.ethers.ZeroAddress
      )
    })

    it('Should set the contract owner correctly', async function () {
      expect(await courtroomParticipants.getContractOwner()).to.equal(contractOwner.address)
    })
  })

  describe('Participant Profile Management', function () {
    it('Should create a participant profile successfully', async function () {
      const tx = await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant1.address,
        0, // JUDGE
        'openrouter',
        'gpt-4',
        'GPT-4',
        8, // expertiseLevel
        9, // eloquenceScore
        7, // analyticalScore
        8, // emotionalIntelligence
        '{"traits": "logical, fair"}'
      )

      const receipt = await tx.wait()
      expect(receipt?.logs.length).to.equal(1) // ProfileCreated event

      const profileId = 1
      const profile = await courtroomParticipants.getParticipantProfile(profileId)

      expect(profile.profileId).to.equal(1)
      expect(profile.participantAddress).to.equal(participant1.address)
      expect(profile.role).to.equal(0) // JUDGE
      expect(profile.modelProvider).to.equal('openrouter')
      expect(profile.modelId).to.equal('gpt-4')
      expect(profile.modelName).to.equal('GPT-4')
      expect(profile.expertiseLevel).to.equal(8)
      expect(profile.eloquenceScore).to.equal(9)
      expect(profile.analyticalScore).to.equal(7)
      expect(profile.emotionalIntelligence).to.equal(8)
      expect(profile.isActive).to.be.true
    })

    it('Should create multiple profiles for different addresses', async function () {
      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant1.address,
        0, // JUDGE
        'openrouter',
        'gpt-4',
        'GPT-4',
        8, 9, 7, 8,
        '{"traits": "logical"}'
      )

      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant2.address,
        1, // PROSECUTOR
        'anthropic',
        'claude-3-sonnet',
        'Claude 3 Sonnet',
        7, 8, 9, 7,
        '{"traits": "persuasive"}'
      )

      const profiles1 = await courtroomParticipants.getProfilesByAddress(participant1.address)
      const profiles2 = await courtroomParticipants.getProfilesByAddress(participant2.address)

      expect(profiles1).to.deep.equal([1])
      expect(profiles2).to.deep.equal([2])
    })

    it('Should update an existing participant profile', async function () {
      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant1.address,
        0, // JUDGE
        'openrouter',
        'gpt-4',
        'GPT-4',
        8, 9, 7, 8,
        '{"traits": "logical"}'
      )

      await courtroomParticipants.connect(contractOwner).updateParticipantProfile(
        1,
        1, // PROSECUTOR
        9, // updated expertiseLevel
        8, // updated eloquenceScore
        8, // updated analyticalScore
        9, // updated emotionalIntelligence
        '{"traits": "updated"}'
      )

      const profile = await courtroomParticipants.getParticipantProfile(1)
      expect(profile.role).to.equal(1) // PROSECUTOR
      expect(profile.expertiseLevel).to.equal(9)
      expect(profile.eloquenceScore).to.equal(8)
      expect(profile.analyticalScore).to.equal(8)
      expect(profile.emotionalIntelligence).to.equal(9)
      expect(profile.personalityTraits).to.equal('{"traits": "updated"}')
    })

    it('Should deactivate a participant profile', async function () {
      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant1.address,
        0, // JUDGE
        'openrouter',
        'gpt-4',
        'GPT-4',
        8, 9, 7, 8,
        '{"traits": "logical"}'
      )

      await courtroomParticipants.connect(contractOwner).deactivateParticipantProfile(1)

      const profile = await courtroomParticipants.getParticipantProfile(1)
      expect(profile.isActive).to.be.false
    })

    it('Should not allow non-owner to create profiles', async function () {
      await expect(
        courtroomParticipants.connect(participant1).createParticipantProfile(
          participant1.address,
          0,
          'openrouter',
          'gpt-4',
          'GPT-4',
          8, 9, 7, 8,
          '{"traits": "logical"}'
        )
      ).to.be.revertedWith('Only contract owner can perform this action')
    })

    it('Should validate score ranges', async function () {
      await expect(
        courtroomParticipants.connect(contractOwner).createParticipantProfile(
          participant1.address,
          0,
          'openrouter',
          'gpt-4',
          'GPT-4',
          0, // expertiseLevel too low
          9, 7, 8,
          '{"traits": "logical"}'
        )
      ).to.be.revertedWith('Expertise level must be 1-10')

      await expect(
        courtroomParticipants.connect(contractOwner).createParticipantProfile(
          participant1.address,
          0,
          'openrouter',
          'gpt-4',
          'GPT-4',
          8, 9, 7, 11, // emotionalIntelligence too high
          '{"traits": "logical"}'
        )
      ).to.be.revertedWith('Emotional intelligence must be 1-10')
    })
  })

  describe('Court Management', function () {
    it('Should create a court successfully', async function () {
      const tx = await courtroomParticipants.connect(courtOwner).createCourt(
        'Supreme Court',
        'Highest court in the land'
      )

      const receipt = await tx.wait()
      expect(receipt?.logs.length).to.equal(1) // CourtCreated event

      const courtId = 1
      const court = await courtroomParticipants.getCourt(courtId)

      expect(court.courtId).to.equal(1)
      expect(court.courtOwner).to.equal(courtOwner.address)
      expect(court.courtName).to.equal('Supreme Court')
      expect(court.courtDescription).to.equal('Highest court in the land')
      expect(court.isActive).to.be.true
    })

    it('Should activate and deactivate courts', async function () {
      await courtroomParticipants.connect(courtOwner).createCourt('Test Court', 'Test Description')

      await courtroomParticipants.connect(courtOwner).deactivateCourt(1)
      let court = await courtroomParticipants.getCourt(1)
      expect(court.isActive).to.be.false

      await courtroomParticipants.connect(courtOwner).activateCourt(1)
      court = await courtroomParticipants.getCourt(1)
      expect(court.isActive).to.be.true
    })

    it('Should not allow non-owner to manage courts', async function () {
      await courtroomParticipants.connect(courtOwner).createCourt('Test Court', 'Test Description')

      await expect(
        courtroomParticipants.connect(participant1).deactivateCourt(1)
      ).to.be.revertedWith('Only court owner can perform this action')
    })

    it('Should allow anyone to create courts', async function () {
      // Anyone should be able to create courts - this is intentional for flexibility
      await courtroomParticipants.connect(participant1).createCourt('Test Court', 'Test Description')
      
      const court = await courtroomParticipants.getCourt(1)
      expect(court.courtOwner).to.equal(participant1.address)
      expect(court.courtName).to.equal('Test Court')
    })

    it('Should enforce one court per account constraint', async function () {
      // First court creation should succeed
      await courtroomParticipants.connect(participant1).createCourt('First Court', 'First Description')
      
      // Second court creation with same address should fail
      await expect(
        courtroomParticipants.connect(participant1).createCourt('Second Court', 'Second Description')
      ).to.be.revertedWith('Account already has a court')
      
      // Different address should be able to create a court
      await courtroomParticipants.connect(participant2).createCourt('Second Court', 'Second Description')
      
      // Check that the mapping works correctly
      expect(await courtroomParticipants.hasCourt(participant1.address)).to.be.true
      expect(await courtroomParticipants.hasCourt(participant2.address)).to.be.true
      expect(await courtroomParticipants.hasCourt(participant3.address)).to.be.false
      
      // Check court IDs
      expect(await courtroomParticipants.getCourtIdByOwner(participant1.address)).to.equal(1)
      expect(await courtroomParticipants.getCourtIdByOwner(participant2.address)).to.equal(2)
      expect(await courtroomParticipants.getCourtIdByOwner(participant3.address)).to.equal(0)
    })
  })

  describe('Participant Assignment', function () {
    beforeEach(async function () {
      // Create profiles
      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant1.address,
        0, // JUDGE
        'openrouter',
        'gpt-4',
        'GPT-4',
        8, 9, 7, 8,
        '{"traits": "logical"}'
      )

      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant2.address,
        1, // PROSECUTOR
        'anthropic',
        'claude-3-sonnet',
        'Claude 3 Sonnet',
        7, 8, 9, 7,
        '{"traits": "persuasive"}'
      )

      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant3.address,
        2, // DEFENSE_ATTORNEY
        'google',
        'gemini-pro',
        'Gemini Pro',
        8, 7, 8, 9,
        '{"traits": "defensive"}'
      )

      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant4.address,
        3, // CLERK
        'openrouter',
        'llama-3',
        'Llama 3',
        6, 8, 7, 8,
        '{"traits": "organized"}'
      )

      // Create court
      await courtroomParticipants.connect(courtOwner).createCourt('Test Court', 'Test Description')
    })

    it('Should assign participants to court successfully', async function () {
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 1, 0) // JUDGE
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 2, 1) // PROSECUTOR
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 3, 2) // DEFENSE_ATTORNEY
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 4, 3) // CLERK

      const participants = await courtroomParticipants.getCourtParticipants(1)
      expect(participants.length).to.equal(4)

      // Check role counts
      expect(await courtroomParticipants.getCourtParticipantCountByRole(1, 0)).to.equal(1) // JUDGE
      expect(await courtroomParticipants.getCourtParticipantCountByRole(1, 1)).to.equal(1) // PROSECUTOR
      expect(await courtroomParticipants.getCourtParticipantCountByRole(1, 2)).to.equal(1) // DEFENSE_ATTORNEY
      expect(await courtroomParticipants.getCourtParticipantCountByRole(1, 3)).to.equal(1) // CLERK
    })

    it('Should get participants by role', async function () {
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 1, 0) // JUDGE
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 2, 1) // PROSECUTOR

      const judges = await courtroomParticipants.getCourtParticipantsByRole(1, 0)
      const prosecutors = await courtroomParticipants.getCourtParticipantsByRole(1, 1)

      expect(judges).to.deep.equal([1])
      expect(prosecutors).to.deep.equal([2])
    })

    it('Should remove participants from court', async function () {
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 1, 0) // JUDGE
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 2, 1) // PROSECUTOR

      await courtroomParticipants.connect(courtOwner).removeParticipantFromCourt(1, 1)

      const participants = await courtroomParticipants.getCourtParticipants(1)
      expect(participants[0].isActive).to.be.false
      expect(participants[1].isActive).to.be.true
    })

    it('Should not assign inactive profiles', async function () {
      await courtroomParticipants.connect(contractOwner).deactivateParticipantProfile(1)

      await expect(
        courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 1, 0)
      ).to.be.revertedWith('Profile must be active')
    })

    it('Should not assign to inactive courts', async function () {
      await courtroomParticipants.connect(courtOwner).deactivateCourt(1)

      await expect(
        courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 1, 0)
      ).to.be.revertedWith('Court must be active')
    })

    it('Should not allow non-owner to assign participants', async function () {
      await expect(
        courtroomParticipants.connect(participant1).assignParticipantToCourt(1, 1, 0)
      ).to.be.revertedWith('Only court owner can perform this action')
    })
  })

  describe('Court Completion Check', function () {
    beforeEach(async function () {
      // Create profiles
      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant1.address,
        0, // JUDGE
        'openrouter',
        'gpt-4',
        'GPT-4',
        8, 9, 7, 8,
        '{"traits": "logical"}'
      )

      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant2.address,
        1, // PROSECUTOR
        'anthropic',
        'claude-3-sonnet',
        'Claude 3 Sonnet',
        7, 8, 9, 7,
        '{"traits": "persuasive"}'
      )

      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant3.address,
        2, // DEFENSE_ATTORNEY
        'google',
        'gemini-pro',
        'Gemini Pro',
        8, 7, 8, 9,
        '{"traits": "defensive"}'
      )

      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant4.address,
        3, // CLERK
        'openrouter',
        'llama-3',
        'Llama 3',
        6, 8, 7, 8,
        '{"traits": "organized"}'
      )

      // Create court
      await courtroomParticipants.connect(courtOwner).createCourt('Test Court', 'Test Description')
    })

    it('Should check if court is complete', async function () {
      // Assign all required roles
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 1, 0) // JUDGE
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 2, 1) // PROSECUTOR
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 3, 2) // DEFENSE_ATTORNEY
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 4, 3) // CLERK

      const isComplete = await courtroomParticipants.isCourtComplete(1)
      expect(isComplete).to.be.true
    })

    it('Should return false for incomplete court', async function () {
      // Only assign some roles
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 1, 0) // JUDGE
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 2, 1) // PROSECUTOR
      // Missing DEFENSE_ATTORNEY and CLERK

      const isComplete = await courtroomParticipants.isCourtComplete(1)
      expect(isComplete).to.be.false
    })

    it('Should handle inactive participants in completion check', async function () {
      // Assign all roles
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 1, 0) // JUDGE
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 2, 1) // PROSECUTOR
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 3, 2) // DEFENSE_ATTORNEY
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 4, 3) // CLERK

      // Remove one participant
      await courtroomParticipants.connect(courtOwner).removeParticipantFromCourt(1, 4) // Remove CLERK

      const isComplete = await courtroomParticipants.isCourtComplete(1)
      expect(isComplete).to.be.false
    })
  })

  describe('View Functions', function () {
    beforeEach(async function () {
      // Create profiles
      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant1.address,
        0, // JUDGE
        'openrouter',
        'gpt-4',
        'GPT-4',
        8, 9, 7, 8,
        '{"traits": "logical"}'
      )

      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant2.address,
        1, // PROSECUTOR
        'anthropic',
        'claude-3-sonnet',
        'Claude 3 Sonnet',
        7, 8, 9, 7,
        '{"traits": "persuasive"}'
      )

      // Create courts with different owners
      await courtroomParticipants.connect(courtOwner).createCourt('Court 1', 'Description 1')
      await courtroomParticipants.connect(participant5).createCourt('Court 2', 'Description 2')
    })

    it('Should get total counts', async function () {
      expect(await courtroomParticipants.getTotalProfiles()).to.equal(2)
      expect(await courtroomParticipants.getTotalCourts()).to.equal(2)
    })

    it('Should get profiles by address', async function () {
      const profiles1 = await courtroomParticipants.getProfilesByAddress(participant1.address)
      const profiles2 = await courtroomParticipants.getProfilesByAddress(participant2.address)
      const profiles3 = await courtroomParticipants.getProfilesByAddress(participant3.address)

      expect(profiles1).to.deep.equal([1])
      expect(profiles2).to.deep.equal([2])
      expect(profiles3).to.deep.equal([])
    })

    it('Should revert for non-existent profile', async function () {
      await expect(
        courtroomParticipants.getParticipantProfile(999)
      ).to.be.revertedWith('Profile does not exist')
    })

    it('Should revert for non-existent court', async function () {
      await expect(
        courtroomParticipants.getCourt(999)
      ).to.be.revertedWith('Court does not exist')
    })
  })

  describe('Events', function () {
    it('Should emit ProfileCreated event', async function () {
      await expect(
        courtroomParticipants.connect(contractOwner).createParticipantProfile(
          participant1.address,
          0,
          'openrouter',
          'gpt-4',
          'GPT-4',
          8, 9, 7, 8,
          '{"traits": "logical"}'
        )
      )
        .to.emit(courtroomParticipants, 'ProfileCreated')
        .withArgs(1, participant1.address, 0, 'openrouter', 'gpt-4', 'GPT-4')
    })

    it('Should emit ProfileUpdated event', async function () {
      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant1.address,
        0,
        'openrouter',
        'gpt-4',
        'GPT-4',
        8, 9, 7, 8,
        '{"traits": "logical"}'
      )

      await expect(
        courtroomParticipants.connect(contractOwner).updateParticipantProfile(
          1,
          1,
          9, 8, 8, 9,
          '{"traits": "updated"}'
        )
      )
        .to.emit(courtroomParticipants, 'ProfileUpdated')
        .withArgs(1, 1, 9, 8)
    })

    it('Should emit ProfileDeactivated event', async function () {
      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant1.address,
        0,
        'openrouter',
        'gpt-4',
        'GPT-4',
        8, 9, 7, 8,
        '{"traits": "logical"}'
      )

      await expect(
        courtroomParticipants.connect(contractOwner).deactivateParticipantProfile(1)
      )
        .to.emit(courtroomParticipants, 'ProfileDeactivated')
        .withArgs(1)
    })

    it('Should emit CourtCreated event', async function () {
      await expect(
        courtroomParticipants.connect(courtOwner).createCourt('Test Court', 'Test Description')
      )
        .to.emit(courtroomParticipants, 'CourtCreated')
        .withArgs(1, courtOwner.address, 'Test Court')
    })

    it('Should emit ParticipantAssigned event', async function () {
      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant1.address,
        0,
        'openrouter',
        'gpt-4',
        'GPT-4',
        8, 9, 7, 8,
        '{"traits": "logical"}'
      )
      await courtroomParticipants.connect(courtOwner).createCourt('Test Court', 'Test Description')

      await expect(
        courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 1, 0)
      )
        .to.emit(courtroomParticipants, 'ParticipantAssigned')
        .withArgs(1, 1, 0)
    })

    it('Should emit ParticipantRemoved event', async function () {
      await courtroomParticipants.connect(contractOwner).createParticipantProfile(
        participant1.address,
        0,
        'openrouter',
        'gpt-4',
        'GPT-4',
        8, 9, 7, 8,
        '{"traits": "logical"}'
      )
      await courtroomParticipants.connect(courtOwner).createCourt('Test Court', 'Test Description')
      await courtroomParticipants.connect(courtOwner).assignParticipantToCourt(1, 1, 0)

      await expect(
        courtroomParticipants.connect(courtOwner).removeParticipantFromCourt(1, 1)
      )
        .to.emit(courtroomParticipants, 'ParticipantRemoved')
        .withArgs(1, 1, 0)
    })
  })
})