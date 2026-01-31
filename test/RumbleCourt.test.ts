import { expect } from 'chai'
import hre from 'hardhat'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import type { RumbleCourt } from '../typechain-types'

describe('RumbleCourt', function () {
  let rumbleCourt: RumbleCourt
  let owner: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let plaintiff1: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let plaintiff2: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]

  beforeEach(async function () {
    ;[owner, plaintiff1, plaintiff2] = await hre.ethers.getSigners()

    const RumbleCourtFactory = await hre.ethers.getContractFactory(
      'RumbleCourt',
      owner
    )
    rumbleCourt = (await RumbleCourtFactory.deploy()) as RumbleCourt
    await rumbleCourt.waitForDeployment()
  })

  describe('Deployment', function () {
    it('Should deploy successfully', async function () {
      expect(await rumbleCourt.getAddress()).to.not.equal(
        hre.ethers.ZeroAddress
      )
    })

    it('Should set the correct owner', async function () {
      expect(await rumbleCourt.owner()).to.equal(owner.address)
    })

    it('Should initialize with case ID 1', async function () {
      expect(await rumbleCourt.nextCaseId()).to.equal(1)
    })
  })

  describe('Case Filing', function () {
    it('Should file a case successfully', async function () {
      const tx = await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Contract Dispute', 'QmHashExample123')

      const receipt = await tx.wait()
      expect(receipt?.logs.length).to.be.greaterThan(0)

      const caseData = await rumbleCourt.getCase(1)
      expect(caseData.caseId).to.equal(1)
      expect(caseData.plaintiff).to.equal(plaintiff1.address)
      expect(caseData.caseTitle).to.equal('Contract Dispute')
      expect(caseData.evidenceHash).to.equal('QmHashExample123')
      expect(caseData.status).to.equal(0) // PENDING
    })

    it('Should increment case IDs correctly', async function () {
      await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Case 1', 'Hash1')
      await rumbleCourt
        .connect(plaintiff2)
        .fileCase('Case 2', 'Hash2')

      expect(await rumbleCourt.nextCaseId()).to.equal(3)
      expect(await rumbleCourt.getTotalCases()).to.equal(2)
    })

    it('Should track user cases correctly', async function () {
      await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Case 1', 'Hash1')
      await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Case 2', 'Hash2')
      await rumbleCourt
        .connect(plaintiff2)
        .fileCase('Case 3', 'Hash3')

      const plaintiff1Cases = await rumbleCourt.getUserCases(plaintiff1.address)
      const plaintiff2Cases = await rumbleCourt.getUserCases(plaintiff2.address)

      expect(plaintiff1Cases.length).to.equal(2)
      expect(plaintiff2Cases.length).to.equal(1)
      expect(plaintiff1Cases[0]).to.equal(1)
      expect(plaintiff1Cases[1]).to.equal(2)
      expect(plaintiff2Cases[0]).to.equal(3)
    })

    it('Should emit CaseFiled event', async function () {
      await expect(
        rumbleCourt.connect(plaintiff1).fileCase('Test Case', 'HashABC')
      )
        .to.emit(rumbleCourt, 'CaseFiled')
        .withArgs(1, plaintiff1.address, 'Test Case')
    })
  })

  describe('Trial Management', function () {
    beforeEach(async function () {
      await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Test Case', 'TestHash')
    })

    it('Should start trial successfully', async function () {
      await rumbleCourt.connect(owner).startTrial(1)

      const caseData = await rumbleCourt.getCase(1)
      expect(caseData.status).to.equal(1) // IN_TRIAL
    })

    it('Should emit TrialStarted event', async function () {
      await expect(rumbleCourt.connect(owner).startTrial(1))
        .to.emit(rumbleCourt, 'TrialStarted')
        .withArgs(1)
    })

    it('Should not allow non-owner to start trial', async function () {
      await expect(
        rumbleCourt.connect(plaintiff1).startTrial(1)
      ).to.be.revertedWith('Only owner')
    })

    it('Should not start trial for non-pending case', async function () {
      await rumbleCourt.connect(owner).startTrial(1)
      
      await expect(
        rumbleCourt.connect(owner).startTrial(1)
      ).to.be.revertedWith('Case must be pending')
    })

    it('Should not start trial for non-existent case', async function () {
      await expect(
        rumbleCourt.connect(owner).startTrial(999)
      ).to.be.revertedWith('Case does not exist')
    })
  })

  describe('Verdict Recording', function () {
    beforeEach(async function () {
      await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Test Case', 'TestHash')
      await rumbleCourt.connect(owner).startTrial(1)
    })

    it('Should record verdict successfully', async function () {
      await rumbleCourt.connect(owner).recordVerdict(
        1,
        0, // GUILTY
        'Based on overwhelming evidence',
        true
      )

      const verdict = await rumbleCourt.getVerdict(1)
      expect(verdict.caseId).to.equal(1)
      expect(verdict.verdictType).to.equal(0) // GUILTY
      expect(verdict.reasoning).to.equal('Based on overwhelming evidence')
      expect(verdict.isFinal).to.be.true
    })

    it('Should update case status when final verdict recorded', async function () {
      await rumbleCourt.connect(owner).recordVerdict(
        1,
        1, // NOT_GUILTY
        'Insufficient evidence',
        true
      )

      const caseData = await rumbleCourt.getCase(1)
      expect(caseData.status).to.equal(2) // COMPLETED
    })

    it('Should not update case status for non-final verdict', async function () {
      await rumbleCourt.connect(owner).recordVerdict(
        1,
        2, // SETTLEMENT
        'Parties reached agreement',
        false
      )

      const caseData = await rumbleCourt.getCase(1)
      expect(caseData.status).to.equal(1) // Still IN_TRIAL
    })

    it('Should emit VerdictRecorded event', async function () {
      await expect(
        rumbleCourt.connect(owner).recordVerdict(
          1,
          3, // DISMISSED
          'Lack of jurisdiction',
          true
        )
      )
        .to.emit(rumbleCourt, 'VerdictRecorded')
        .withArgs(1, 3, true)
    })

    it('Should not allow non-owner to record verdict', async function () {
      await expect(
        rumbleCourt.connect(plaintiff1).recordVerdict(1, 0, 'Test', true)
      ).to.be.revertedWith('Only owner')
    })

    it('Should not record verdict for non-trial case', async function () {
      await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Another Case', 'Hash')
      
      await expect(
        rumbleCourt.connect(owner).recordVerdict(2, 0, 'Test', true)
      ).to.be.revertedWith('Case must be in trial')
    })

    it('Should check if case has verdict', async function () {
      expect(await rumbleCourt.hasVerdict(1)).to.be.false

      await rumbleCourt.connect(owner).recordVerdict(1, 0, 'Test', true)

      expect(await rumbleCourt.hasVerdict(1)).to.be.true
    })
  })

  describe('Appeals', function () {
    beforeEach(async function () {
      await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Test Case', 'TestHash')
      await rumbleCourt.connect(owner).startTrial(1)
      await rumbleCourt.connect(owner).recordVerdict(
        1,
        0, // GUILTY
        'Guilty verdict',
        true
      )
    })

    it('Should appeal case successfully', async function () {
      await rumbleCourt.connect(plaintiff1).appealCase(1)

      const caseData = await rumbleCourt.getCase(1)
      expect(caseData.status).to.equal(3) // APPEALED
    })

    it('Should emit CaseAppealed event', async function () {
      await expect(rumbleCourt.connect(plaintiff1).appealCase(1))
        .to.emit(rumbleCourt, 'CaseAppealed')
        .withArgs(1)
    })

    it('Should not allow non-plaintiff to appeal', async function () {
      await expect(
        rumbleCourt.connect(plaintiff2).appealCase(1)
      ).to.be.revertedWith('Only plaintiff can appeal')
    })

    it('Should not appeal non-completed case', async function () {
      await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Another Case', 'Hash')
      await rumbleCourt.connect(owner).startTrial(2)
      
      await expect(
        rumbleCourt.connect(plaintiff1).appealCase(2)
      ).to.be.revertedWith('Case must be completed')
    })

    it('Should not appeal case without final verdict', async function () {
      await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Another Case', 'Hash')
      await rumbleCourt.connect(owner).startTrial(2)
      await rumbleCourt.connect(owner).recordVerdict(
        2,
        0,
        'Non-final',
        false
      )
      
      await expect(
        rumbleCourt.connect(plaintiff1).appealCase(2)
      ).to.be.revertedWith('Case must be completed')
    })
  })

  describe('View Functions', function () {
    beforeEach(async function () {
      await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Case 1', 'Hash1')
      await rumbleCourt
        .connect(plaintiff2)
        .fileCase('Case 2', 'Hash2')
      await rumbleCourt.connect(owner).startTrial(1)
      await rumbleCourt.connect(owner).recordVerdict(1, 0, 'Verdict 1', true)
    })

    it('Should get case details correctly', async function () {
      const caseData = await rumbleCourt.getCase(1)
      
      expect(caseData.caseId).to.equal(1)
      expect(caseData.plaintiff).to.equal(plaintiff1.address)
      expect(caseData.caseTitle).to.equal('Case 1')
      expect(caseData.evidenceHash).to.equal('Hash1')
    })

    it('Should get verdict correctly', async function () {
      const verdict = await rumbleCourt.getVerdict(1)
      
      expect(verdict.caseId).to.equal(1)
      expect(verdict.verdictType).to.equal(0)
      expect(verdict.reasoning).to.equal('Verdict 1')
      expect(verdict.isFinal).to.be.true
    })

    it('Should revert when getting non-existent case', async function () {
      await expect(
        rumbleCourt.getCase(999)
      ).to.be.revertedWith('Case does not exist')
    })

    it('Should revert when getting verdict for case without verdict', async function () {
      await expect(
        rumbleCourt.getVerdict(2)
      ).to.be.revertedWith('No verdict recorded')
    })

    it('Should get total cases correctly', async function () {
      expect(await rumbleCourt.getTotalCases()).to.equal(2)
    })

    it('Should get user cases correctly', async function () {
      const plaintiff1Cases = await rumbleCourt.getUserCases(plaintiff1.address)
      const plaintiff2Cases = await rumbleCourt.getUserCases(plaintiff2.address)
      
      expect(plaintiff1Cases.length).to.equal(1)
      expect(plaintiff2Cases.length).to.equal(1)
    })
  })

  describe('Complete Workflow', function () {
    it('Should handle complete case lifecycle', async function () {
      // 1. File case
      await rumbleCourt
        .connect(plaintiff1)
        .fileCase('Fraud Case', 'QmFraudEvidence')
      
      let caseData = await rumbleCourt.getCase(1)
      expect(caseData.status).to.equal(0) // PENDING

      // 2. Start trial
      await rumbleCourt.connect(owner).startTrial(1)
      caseData = await rumbleCourt.getCase(1)
      expect(caseData.status).to.equal(1) // IN_TRIAL

      // 3. Record verdict
      await rumbleCourt.connect(owner).recordVerdict(
        1,
        0, // GUILTY
        'Evidence was compelling',
        true
      )
      caseData = await rumbleCourt.getCase(1)
      expect(caseData.status).to.equal(2) // COMPLETED

      // 4. Appeal
      await rumbleCourt.connect(plaintiff1).appealCase(1)
      caseData = await rumbleCourt.getCase(1)
      expect(caseData.status).to.equal(3) // APPEALED
    })

    it('Should handle multiple cases simultaneously', async function () {
      // File multiple cases
      await rumbleCourt.connect(plaintiff1).fileCase('Case A', 'HashA')
      await rumbleCourt.connect(plaintiff2).fileCase('Case B', 'HashB')
      await rumbleCourt.connect(plaintiff1).fileCase('Case C', 'HashC')

      // Start trials
      await rumbleCourt.connect(owner).startTrial(1)
      await rumbleCourt.connect(owner).startTrial(2)

      // Record verdicts
      await rumbleCourt.connect(owner).recordVerdict(1, 0, 'Verdict A', true)
      await rumbleCourt.connect(owner).recordVerdict(2, 1, 'Verdict B', true)

      // Verify states
      const case1 = await rumbleCourt.getCase(1)
      const case2 = await rumbleCourt.getCase(2)
      const case3 = await rumbleCourt.getCase(3)

      expect(case1.status).to.equal(2) // COMPLETED
      expect(case2.status).to.equal(2) // COMPLETED
      expect(case3.status).to.equal(0) // PENDING

      expect(await rumbleCourt.hasVerdict(1)).to.be.true
      expect(await rumbleCourt.hasVerdict(2)).to.be.true
      expect(await rumbleCourt.hasVerdict(3)).to.be.false
    })
  })
})