import { expect } from 'chai'
import hre from 'hardhat'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import type { VerdictStorage } from '../typechain-types'

describe('VerdictStorage', function () {
  let verdictStorage: VerdictStorage
  let owner: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let judge1: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let judge2: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let appellant: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]

  beforeEach(async function () {
    ;[owner, judge1, judge2, appellant] = await hre.ethers.getSigners()

    const VerdictStorageFactory = await hre.ethers.getContractFactory(
      'VerdictStorage',
      owner
    )
    verdictStorage = (await VerdictStorageFactory.deploy()) as VerdictStorage
    await verdictStorage.waitForDeployment()

    // Authorize judge1
    await verdictStorage.connect(owner).addAuthorizedJudge(judge1.address)
  })

  describe('Deployment', function () {
    it('Should deploy successfully', async function () {
      expect(await verdictStorage.getAddress()).to.not.equal(
        hre.ethers.ZeroAddress
      )
    })

    it('Should set the owner correctly', async function () {
      // Owner should be able to add judges
      await expect(
        verdictStorage.connect(owner).addAuthorizedJudge(judge2.address)
      ).to.not.be.reverted
    })
  })

  describe('Access Control', function () {
    it('Should allow owner to add authorized judges', async function () {
      await verdictStorage.connect(owner).addAuthorizedJudge(judge2.address)
      expect(await verdictStorage.isAuthorizedJudge(judge2.address)).to.be.true
    })

    it('Should allow owner to remove authorized judges', async function () {
      await verdictStorage.connect(owner).addAuthorizedJudge(judge2.address)
      await verdictStorage.connect(owner).removeAuthorizedJudge(judge2.address)
      expect(await verdictStorage.isAuthorizedJudge(judge2.address)).to.be.false
    })

    it('Should not allow non-owner to add judges', async function () {
      await expect(
        verdictStorage.connect(judge1).addAuthorizedJudge(judge2.address)
      ).to.be.revertedWith('Only owner can perform this action')
    })

    it('Should not allow non-authorized judge to record verdict', async function () {
      await expect(
        verdictStorage.connect(appellant).recordVerdict(
          1,
          0, // GUILTY
          'Test verdict',
          'Test reasoning',
          [],
          false
        )
      ).to.be.revertedWith('Only authorized judges can perform this action')
    })
  })

  describe('Verdict Recording', function () {
    it('Should record a verdict successfully', async function () {
      const tx = await verdictStorage.connect(judge1).recordVerdict(
        1,
        0, // GUILTY
        'Defendant is guilty',
        'Based on evidence presented',
        ['Document 1', 'Document 2'],
        true
      )

      const receipt = await tx.wait()
      expect(receipt?.logs.length).to.equal(2) // VerdictRecorded and VerdictFinalized events

      const verdictId = 1
      const verdict = await verdictStorage.getVerdict(verdictId)

      expect(verdict.caseId).to.equal(1)
      expect(verdict.judge).to.equal(judge1.address)
      expect(verdict.verdictType).to.equal(0) // GUILTY
      expect(verdict.verdictDetails).to.equal('Defendant is guilty')
      expect(verdict.reasoning).to.equal('Based on evidence presented')
      expect(verdict.isFinal).to.be.true
      expect(verdict.supportingDocumentsText).to.deep.equal([
        'Document 1',
        'Document 2',
      ])
    })

    it('Should increment verdict IDs correctly', async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict 1', 'Reasoning 1', [], false)
      await verdictStorage
        .connect(judge1)
        .recordVerdict(2, 1, 'Verdict 2', 'Reasoning 2', [], false)

      const verdict1 = await verdictStorage.getVerdict(1)
      const verdict2 = await verdictStorage.getVerdict(2)

      expect(verdict1.verdictId).to.equal(1)
      expect(verdict2.verdictId).to.equal(2)
      expect(await verdictStorage.getTotalVerdicts()).to.equal(2)
    })

    it('Should track verdicts by case', async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict 1', 'Reasoning 1', [], false)
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 1, 'Verdict 2', 'Reasoning 2', [], false)
      await verdictStorage
        .connect(judge1)
        .recordVerdict(2, 2, 'Verdict 3', 'Reasoning 3', [], false)

      const case1Verdicts = await verdictStorage.getVerdictsByCase(1)
      const case2Verdicts = await verdictStorage.getVerdictsByCase(2)

      expect(case1Verdicts).to.deep.equal([1, 2])
      expect(case2Verdicts).to.deep.equal([3])
    })

    it('Should track verdicts by judge', async function () {
      // Authorize judge2
      await verdictStorage.connect(owner).addAuthorizedJudge(judge2.address)

      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict 1', 'Reasoning 1', [], false)
      await verdictStorage
        .connect(judge2)
        .recordVerdict(2, 1, 'Verdict 2', 'Reasoning 2', [], false)
      await verdictStorage
        .connect(judge1)
        .recordVerdict(3, 2, 'Verdict 3', 'Reasoning 3', [], false)

      const judge1Verdicts = await verdictStorage.getVerdictsByJudge(
        judge1.address
      )
      const judge2Verdicts = await verdictStorage.getVerdictsByJudge(
        judge2.address
      )

      expect(judge1Verdicts).to.deep.equal([1, 3])
      expect(judge2Verdicts).to.deep.equal([2])
    })
  })

  describe('Verdict Finalization', function () {
    it('Should finalize a verdict', async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict', 'Reasoning', [], false)
      expect(await verdictStorage.isVerdictFinal(1)).to.be.false

      await verdictStorage.connect(judge1).finalizeVerdict(1)
      expect(await verdictStorage.isVerdictFinal(1)).to.be.true
    })

    it('Should not allow finalizing already final verdict', async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict', 'Reasoning', [], true)
      await expect(
        verdictStorage.connect(judge1).finalizeVerdict(1)
      ).to.be.revertedWith('Verdict is already final')
    })

    it('Should not allow non-judge to finalize verdict', async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict', 'Reasoning', [], false)
      await expect(
        verdictStorage.connect(appellant).finalizeVerdict(1)
      ).to.be.revertedWith('Only authorized judges can perform this action')
    })
  })

  describe('Appeal Filing', function () {
    beforeEach(async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict', 'Reasoning', [], true)
    })

    it('Should file an appeal successfully', async function () {
      const tx = await verdictStorage
        .connect(appellant)
        .fileAppeal(1, 'Disagree with verdict', ['Appeal document 1'])

      const receipt = await tx.wait()
      expect(receipt?.logs.length).to.equal(1) // AppealFiled event

      const appealId = 1
      const appeal = await verdictStorage.getAppeal(appealId)

      expect(appeal.originalVerdictId).to.equal(1)
      expect(appeal.appellant).to.equal(appellant.address)
      expect(appeal.appealReason).to.equal('Disagree with verdict')
      expect(appeal.status).to.equal(0) // FILED
      expect(appeal.appealDocumentsText).to.deep.equal(['Appeal document 1'])
    })

    it('Should not allow appealing non-final verdict', async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(2, 1, 'Verdict 2', 'Reasoning 2', [], false)
      await expect(
        verdictStorage.connect(appellant).fileAppeal(2, 'Appeal reason', [])
      ).to.be.revertedWith('Cannot appeal non-final verdict')
    })

    it('Should not allow appealing non-existent verdict', async function () {
      await expect(
        verdictStorage.connect(appellant).fileAppeal(999, 'Appeal reason', [])
      ).to.be.revertedWith('Original verdict does not exist')
    })

    it('Should track appeals by verdict', async function () {
      await verdictStorage.connect(appellant).fileAppeal(1, 'Appeal 1', [])
      await verdictStorage.connect(appellant).fileAppeal(1, 'Appeal 2', [])

      const appeals = await verdictStorage.getAppealsByVerdict(1)
      expect(appeals).to.deep.equal([1, 2])
    })

    it('Should track appeals by appellant', async function () {
      const appellant2 = judge2 // Using judge2 as second appellant
      await verdictStorage.connect(appellant).fileAppeal(1, 'Appeal 1', [])
      await verdictStorage.connect(appellant2).fileAppeal(1, 'Appeal 2', [])

      const appellant1Appeals = await verdictStorage.getAppealsByAppellant(
        appellant.address
      )
      const appellant2Appeals = await verdictStorage.getAppealsByAppellant(
        appellant2.address
      )

      expect(appellant1Appeals).to.deep.equal([1])
      expect(appellant2Appeals).to.deep.equal([2])
    })
  })

  describe('Appeal Management', function () {
    beforeEach(async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict', 'Reasoning', [], true)
      await verdictStorage.connect(appellant).fileAppeal(1, 'Appeal reason', [])
    })

    it('Should update appeal status', async function () {
      await verdictStorage
        .connect(judge1)
        .updateAppealStatus(1, 2, 'Appeal granted') // GRANTED

      const appeal = await verdictStorage.getAppeal(1)
      expect(appeal.status).to.equal(2) // GRANTED
    })

    it('Should schedule appeal hearing', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400 // 1 day from now
      await verdictStorage.connect(judge1).scheduleAppealHearing(1, futureTime)

      const appeal = await verdictStorage.getAppeal(1)
      expect(appeal.hearingDate).to.equal(futureTime)
      expect(appeal.status).to.equal(2) // SCHEDULED
    })

    it('Should not schedule hearing in the past', async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 86400 // 1 day ago
      await expect(
        verdictStorage.connect(judge1).scheduleAppealHearing(1, pastTime)
      ).to.be.revertedWith('Hearing date must be in the future')
    })

    it('Should not allow non-judge to update appeal status', async function () {
      await expect(
        verdictStorage.connect(appellant).updateAppealStatus(1, 2, 'Decision')
      ).to.be.revertedWith('Only authorized judges can perform this action')
    })
  })

  describe('View Functions', function () {
    beforeEach(async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict 1', 'Reasoning 1', ['Doc 1'], true)
      await verdictStorage
        .connect(judge1)
        .recordVerdict(2, 1, 'Verdict 2', 'Reasoning 2', [], false)
      await verdictStorage
        .connect(appellant)
        .fileAppeal(1, 'Appeal reason', ['Appeal doc'])
    })

    it('Should return correct verdict details', async function () {
      const verdict = await verdictStorage.getVerdict(1)
      expect(verdict.caseId).to.equal(1)
      expect(verdict.verdictType).to.equal(0) // GUILTY
      expect(verdict.isFinal).to.be.true
    })

    it('Should return correct appeal details', async function () {
      const appeal = await verdictStorage.getAppeal(1)
      expect(appeal.originalVerdictId).to.equal(1)
      expect(appeal.appellant).to.equal(appellant.address)
      expect(appeal.status).to.equal(0) // FILED
    })

    it('Should return correct totals', async function () {
      expect(await verdictStorage.getTotalVerdicts()).to.equal(2)
      expect(await verdictStorage.getTotalAppeals()).to.equal(1)
    })

    it('Should revert for non-existent verdict', async function () {
      await expect(verdictStorage.getVerdict(999)).to.be.revertedWith(
        'Verdict does not exist'
      )
    })

    it('Should revert for non-existent appeal', async function () {
      await expect(verdictStorage.getAppeal(999)).to.be.revertedWith(
        'Appeal does not exist'
      )
    })
  })

  describe('Events', function () {
    it('Should emit VerdictRecorded event', async function () {
      await expect(
        verdictStorage
          .connect(judge1)
          .recordVerdict(1, 0, 'Verdict', 'Reasoning', [], true)
      )
        .to.emit(verdictStorage, 'VerdictRecorded')
        .withArgs(1, 1, judge1.address, 0, true)
    })

    it('Should emit VerdictFinalized event when recording final verdict', async function () {
      await expect(
        verdictStorage
          .connect(judge1)
          .recordVerdict(1, 0, 'Verdict', 'Reasoning', [], true)
      )
        .to.emit(verdictStorage, 'VerdictFinalized')
        .withArgs(1, 1)
    })

    it('Should emit VerdictFinalized event when finalizing verdict', async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict', 'Reasoning', [], false)
      await expect(verdictStorage.connect(judge1).finalizeVerdict(1))
        .to.emit(verdictStorage, 'VerdictFinalized')
        .withArgs(1, 1)
    })

    it('Should emit AppealFiled event', async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict', 'Reasoning', [], true)
      await expect(
        verdictStorage.connect(appellant).fileAppeal(1, 'Appeal reason', [])
      )
        .to.emit(verdictStorage, 'AppealFiled')
        .withArgs(1, 1, appellant.address, 'Appeal reason')
    })

    it('Should emit AppealDecision event', async function () {
      await verdictStorage
        .connect(judge1)
        .recordVerdict(1, 0, 'Verdict', 'Reasoning', [], true)
      await verdictStorage.connect(appellant).fileAppeal(1, 'Appeal reason', [])
      await expect(
        verdictStorage.connect(judge1).updateAppealStatus(1, 4, 'Appeal denied')
      ) // DENIED
        .to.emit(verdictStorage, 'AppealDecision')
        .withArgs(1, 4, 'Appeal denied')
    })
  })
})
