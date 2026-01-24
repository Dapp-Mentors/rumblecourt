import { expect } from 'chai'
import hre from 'hardhat'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import type { AdjournmentTracking } from '../typechain-types'

describe('AdjournmentTracking', function () {
  let adjournmentTracking: AdjournmentTracking
  let owner: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let judge1: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let judge2: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]
  let requester: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]

  beforeEach(async function () {
    ;[owner, judge1, judge2, requester] = await hre.ethers.getSigners()

    const AdjournmentTrackingFactory = await hre.ethers.getContractFactory(
      'AdjournmentTracking',
      owner
    )
    adjournmentTracking = (await AdjournmentTrackingFactory.deploy()) as AdjournmentTracking
    await adjournmentTracking.waitForDeployment()

    // Authorize judge1
    await adjournmentTracking.connect(owner).addAuthorizedJudge(judge1.address)
  })

  describe('Deployment', function () {
    it('Should deploy successfully', async function () {
      expect(await adjournmentTracking.getAddress()).to.not.equal(
        hre.ethers.ZeroAddress
      )
    })

    it('Should set the owner correctly', async function () {
      // Owner should be able to add judges
      await expect(
        adjournmentTracking.connect(owner).addAuthorizedJudge(judge2.address)
      ).to.not.be.reverted
    })
  })

  describe('Access Control', function () {
    it('Should allow owner to add authorized judges', async function () {
      await adjournmentTracking.connect(owner).addAuthorizedJudge(judge2.address)
      expect(await adjournmentTracking.isAuthorizedJudge(judge2.address)).to.be.true
    })

    it('Should allow owner to remove authorized judges', async function () {
      await adjournmentTracking.connect(owner).addAuthorizedJudge(judge2.address)
      await adjournmentTracking.connect(owner).removeAuthorizedJudge(judge2.address)
      expect(await adjournmentTracking.isAuthorizedJudge(judge2.address)).to.be.false
    })

    it('Should not allow non-owner to add judges', async function () {
      await expect(
        adjournmentTracking.connect(judge1).addAuthorizedJudge(judge2.address)
      ).to.be.revertedWith('Only owner can perform this action')
    })

    it('Should not allow non-authorized judge to approve adjournment', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400 // 1 day from now
      await adjournmentTracking.connect(requester).requestAdjournment(
        1,
        0, // JUDGE_UNAVAILABLE
        'Judge unavailable',
        futureTime,
        []
      )
      await expect(
        adjournmentTracking.connect(requester).approveAdjournment(1, futureTime, 'Approved')
      ).to.be.revertedWith('Only authorized judges can perform this action')
    })
  })

  describe('Adjournment Requesting', function () {
    it('Should request adjournment successfully', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400 // 1 day from now
      const tx = await adjournmentTracking.connect(requester).requestAdjournment(
        1,
        0, // JUDGE_UNAVAILABLE
        'Judge is unavailable',
        futureTime,
        ['Medical certificate', 'Court notice']
      )

      const receipt = await tx.wait()
      expect(receipt?.logs.length).to.equal(1) // AdjournmentRequested event

      const adjournmentId = 1
      const adjournment = await adjournmentTracking.getAdjournment(adjournmentId)

      expect(adjournment.caseId).to.equal(1)
      expect(adjournment.requestedBy).to.equal(requester.address)
      expect(adjournment.reason).to.equal(0) // JUDGE_UNAVAILABLE
      expect(adjournment.reasonDetails).to.equal('Judge is unavailable')
      expect(adjournment.newHearingDate).to.equal(futureTime)
      expect(adjournment.status).to.equal(0) // REQUESTED
      expect(adjournment.supportingDocumentsText).to.deep.equal(['Medical certificate', 'Court notice'])
    })

    it('Should increment adjournment IDs correctly', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Reason 1', futureTime, [])
      await adjournmentTracking.connect(requester).requestAdjournment(2, 1, 'Reason 2', futureTime + 1000, [])

      const adjournment1 = await adjournmentTracking.getAdjournment(1)
      const adjournment2 = await adjournmentTracking.getAdjournment(2)

      expect(adjournment1.adjournmentId).to.equal(1)
      expect(adjournment2.adjournmentId).to.equal(2)
      expect(await adjournmentTracking.getTotalAdjournmentRequests()).to.equal(2)
    })

    it('Should track adjournments by case', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Reason 1', futureTime, [])
      await adjournmentTracking.connect(requester).requestAdjournment(1, 1, 'Reason 2', futureTime + 1000, [])
      await adjournmentTracking.connect(requester).requestAdjournment(2, 2, 'Reason 3', futureTime + 2000, [])

      const case1AdjournmentIds = await adjournmentTracking.getAdjournamentsByCase(1)
      const case2AdjournmentIds = await adjournmentTracking.getAdjournamentsByCase(2)

      expect(case1AdjournmentIds).to.deep.equal([1, 2])
      expect(case2AdjournmentIds).to.deep.equal([3])
    })

    it('Should track adjournments by requester', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      const requester2 = judge2 // Using judge2 as second requester
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Reason 1', futureTime, [])
      await adjournmentTracking.connect(requester2).requestAdjournment(2, 1, 'Reason 2', futureTime + 1000, [])
      await adjournmentTracking.connect(requester).requestAdjournment(3, 2, 'Reason 3', futureTime + 2000, [])

      const requester1AdjournmentIds = await adjournmentTracking.getAdjournamentsByRequester(requester.address)
      const requester2AdjournmentIds = await adjournmentTracking.getAdjournamentsByRequester(requester2.address)

      expect(requester1AdjournmentIds).to.deep.equal([1, 3])
      expect(requester2AdjournmentIds).to.deep.equal([2])
    })

    it('Should not allow adjournment request for past date', async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 86400 // 1 day ago
      await expect(
        adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Reason', pastTime, [])
      ).to.be.revertedWith('Requested date must be in the future')
    })
  })

  describe('Adjournment Approval', function () {
    beforeEach(async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Judge unavailable', futureTime, [])
    })

    it('Should approve adjournment successfully', async function () {
      const approvedTime = Math.floor(Date.now() / 1000) + 172800 // 2 days from now
      const tx = await adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime, 'Approved for medical reasons')

      const receipt = await tx.wait()
      expect(receipt?.logs.length).to.equal(1) // AdjournmentApproved event

      const adjournment = await adjournmentTracking.getAdjournment(1)
      expect(adjournment.status).to.equal(2) // APPROVED
      expect(adjournment.newHearingDate).to.equal(approvedTime)
      expect(adjournment.approvedBy).to.equal(judge1.address)
      expect(adjournment.approvalDate).to.not.equal(0)
    })

    it('Should not approve non-existent adjournment', async function () {
      const approvedTime = Math.floor(Date.now() / 1000) + 172800
      await expect(
        adjournmentTracking.connect(judge1).approveAdjournment(999, approvedTime, 'Approved')
      ).to.be.revertedWith('Adjournment does not exist')
    })

    it('Should not approve already approved adjournment', async function () {
      const approvedTime = Math.floor(Date.now() / 1000) + 172800
      await adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime, 'Approved')

      await expect(
        adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime + 1000, 'Re-approved')
      ).to.be.revertedWith('Adjournment must be in REQUESTED status')
    })

    it('Should not approve with past date', async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 86400
      await expect(
        adjournmentTracking.connect(judge1).approveAdjournment(1, pastTime, 'Approved')
      ).to.be.revertedWith('Approved date must be in the future')
    })

    it('Should not allow non-judge to approve', async function () {
      const approvedTime = Math.floor(Date.now() / 1000) + 172800
      await expect(
        adjournmentTracking.connect(requester).approveAdjournment(1, approvedTime, 'Approved')
      ).to.be.revertedWith('Only authorized judges can perform this action')
    })
  })

  describe('Adjournment Denial', function () {
    beforeEach(async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Judge unavailable', futureTime, [])
    })

    it('Should deny adjournment successfully', async function () {
      const tx = await adjournmentTracking.connect(judge1).denyAdjournment(1, 'Insufficient grounds')

      const receipt = await tx.wait()
      expect(receipt?.logs.length).to.equal(1) // AdjournmentDenied event

      const adjournment = await adjournmentTracking.getAdjournment(1)
      expect(adjournment.status).to.equal(3) // DENIED
      expect(adjournment.approvedBy).to.equal(judge1.address)
    })

    it('Should not deny non-existent adjournment', async function () {
      await expect(
        adjournmentTracking.connect(judge1).denyAdjournment(999, 'Denied')
      ).to.be.revertedWith('Adjournment does not exist')
    })

    it('Should not deny already processed adjournment', async function () {
      await adjournmentTracking.connect(judge1).denyAdjournment(1, 'Denied')

      await expect(
        adjournmentTracking.connect(judge1).denyAdjournment(1, 'Re-denied')
      ).to.be.revertedWith('Adjournment must be in REQUESTED status')
    })
  })

  describe('Adjournment Cancellation', function () {
    beforeEach(async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Judge unavailable', futureTime, [])
      const approvedTime = Math.floor(Date.now() / 1000) + 172800
      await adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime, 'Approved')
    })

    it('Should cancel approved adjournment successfully', async function () {
      const tx = await adjournmentTracking.connect(judge1).cancelAdjournment(1, 'Case resolved')

      const receipt = await tx.wait()
      expect(receipt?.logs.length).to.equal(1) // AdjournmentCancelled event

      const adjournment = await adjournmentTracking.getAdjournment(1)
      expect(adjournment.status).to.equal(4) // CANCELLED
    })

    it('Should not cancel non-approved adjournment', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(2, 0, 'Reason', futureTime, [])

      await expect(
        adjournmentTracking.connect(judge1).cancelAdjournment(2, 'Cancel')
      ).to.be.revertedWith('Adjournment must be in APPROVED status')
    })
  })

  describe('Adjournment Completion', function () {
    beforeEach(async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Judge unavailable', futureTime, [])
      const approvedTime = Math.floor(Date.now() / 1000) + 172800
      await adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime, 'Approved')
    })

    it('Should complete adjournment successfully', async function () {
      await adjournmentTracking.connect(judge1).completeAdjournment(1)

      const adjournment = await adjournmentTracking.getAdjournment(1)
      expect(adjournment.status).to.equal(5) // COMPLETED
    })

    it('Should not complete non-approved adjournment', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(2, 0, 'Reason', futureTime, [])

      await expect(
        adjournmentTracking.connect(judge1).completeAdjournment(2)
      ).to.be.revertedWith('Adjournment must be in APPROVED status')
    })
  })

  describe('Emergency Rescheduling', function () {
    beforeEach(async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Judge unavailable', futureTime, [])
      const approvedTime = Math.floor(Date.now() / 1000) + 172800
      await adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime, 'Approved')
    })

    it('Should emergency reschedule successfully', async function () {
      const newTime = Math.floor(Date.now() / 1000) + 259200 // 3 days from now
      const tx = await adjournmentTracking.connect(judge1).emergencyReschedule(1, newTime, 'Emergency circumstances')

      const receipt = await tx.wait()
      expect(receipt?.logs.length).to.equal(1) // HearingRescheduled event
    })

    it('Should not emergency reschedule with past date', async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 86400
      await expect(
        adjournmentTracking.connect(judge1).emergencyReschedule(1, pastTime, 'Emergency')
      ).to.be.revertedWith('New hearing date must be in the future')
    })
  })

  describe('View Functions', function () {
    beforeEach(async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Reason 1', futureTime, ['Doc 1'])
      await adjournmentTracking.connect(requester).requestAdjournment(1, 1, 'Reason 2', futureTime + 1000, [])
      await adjournmentTracking.connect(requester).requestAdjournment(2, 2, 'Reason 3', futureTime + 2000, [])
    })

    it('Should return correct adjournment details', async function () {
      const adjournment = await adjournmentTracking.getAdjournment(1)
      expect(adjournment.caseId).to.equal(1)
      expect(adjournment.reason).to.equal(0) // JUDGE_UNAVAILABLE
      expect(adjournment.status).to.equal(0) // REQUESTED
    })

    it('Should return adjournments by status', async function () {
      const requestedAdjournmentIds = await adjournmentTracking.getAdjournamentsByStatus(0) // REQUESTED
      expect(requestedAdjournmentIds).to.deep.equal([1, 2, 3])
    })

    it('Should return pending adjournment requests', async function () {
      const pendingAdjournmentIds = await adjournmentTracking.getPendingAdjournmentRequests(1)
      expect(pendingAdjournmentIds).to.deep.equal([1, 2])
    })

    it('Should check for active adjournments', async function () {
      expect(await adjournmentTracking.hasActiveAdjournment(1)).to.be.false

      // Approve one adjournment
      const approvedTime = Math.floor(Date.now() / 1000) + 172800
      await adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime, 'Approved')
      expect(await adjournmentTracking.hasActiveAdjournment(1)).to.be.true
    })

    it('Should get next hearing date', async function () {
      expect(await adjournmentTracking.getNextHearingDate(1)).to.equal(0)

      // Approve adjournments - adjournment 1 is for case 1, adjournment 3 is for case 2
      const approvedTime1 = Math.floor(Date.now() / 1000) + 172800
      const approvedTime2 = Math.floor(Date.now() / 1000) + 259200
      await adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime1, 'Approved')
      await adjournmentTracking.connect(judge1).approveAdjournment(3, approvedTime2, 'Approved')

      expect(await adjournmentTracking.getNextHearingDate(1)).to.equal(approvedTime1)
      expect(await adjournmentTracking.getNextHearingDate(2)).to.equal(approvedTime2)
    })

    it('Should get adjournments in date range', async function () {
      // Get current block timestamp for date range
      const currentTime = Math.floor(Date.now() / 1000)
      const startDate = currentTime - 3600 // 1 hour ago
      const endDate = currentTime + 3600 // 1 hour from now

      const adjournmentIdsInRange = await adjournmentTracking.getAdjournamentsInDateRange(startDate, endDate)
      expect(adjournmentIdsInRange.length).to.equal(3)
    })

    it('Should return correct statistics', async function () {
      const stats = await adjournmentTracking.getAdjournmentStatistics()
      expect(stats.pending).to.equal(3)
      expect(stats.approved).to.equal(0)
      expect(stats.denied).to.equal(0)

      // Approve one and deny one
      const approvedTime = Math.floor(Date.now() / 1000) + 172800
      await adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime, 'Approved')
      await adjournmentTracking.connect(judge1).denyAdjournment(2, 'Denied')

      const updatedStats = await adjournmentTracking.getAdjournmentStatistics()
      expect(updatedStats.pending).to.equal(1)
      expect(updatedStats.approved).to.equal(1)
      expect(updatedStats.denied).to.equal(1)
    })

    it('Should revert for non-existent adjournment', async function () {
      await expect(adjournmentTracking.getAdjournment(999)).to.be.revertedWith(
        'Adjournment does not exist'
      )
    })

    it('Should return correct totals', async function () {
      expect(await adjournmentTracking.getTotalAdjournmentRequests()).to.equal(3)
    })
  })

  describe('Events', function () {
    it('Should emit AdjournmentRequested event', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await expect(
        adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Reason', futureTime, [])
      )
        .to.emit(adjournmentTracking, 'AdjournmentRequested')
        .withArgs(1, 1, requester.address, 0)
    })

    it('Should emit AdjournmentApproved event', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Reason', futureTime, [])
      const approvedTime = Math.floor(Date.now() / 1000) + 172800

      await expect(
        adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime, 'Approved')
      )
        .to.emit(adjournmentTracking, 'AdjournmentApproved')
        .withArgs(1, 1, judge1.address, approvedTime)
    })

    it('Should emit AdjournmentDenied event', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Reason', futureTime, [])

      await expect(
        adjournmentTracking.connect(judge1).denyAdjournment(1, 'Insufficient grounds')
      )
        .to.emit(adjournmentTracking, 'AdjournmentDenied')
        .withArgs(1, 1, judge1.address, 'Insufficient grounds')
    })

    it('Should emit AdjournmentCancelled event', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Reason', futureTime, [])
      const approvedTime = Math.floor(Date.now() / 1000) + 172800
      await adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime, 'Approved')

      await expect(
        adjournmentTracking.connect(judge1).cancelAdjournment(1, 'Case resolved')
      )
        .to.emit(adjournmentTracking, 'AdjournmentCancelled')
        .withArgs(1, 1, 'Case resolved')
    })

    it('Should emit HearingRescheduled event for emergency reschedule', async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400
      await adjournmentTracking.connect(requester).requestAdjournment(1, 0, 'Reason', futureTime, [])
      const approvedTime = Math.floor(Date.now() / 1000) + 172800
      await adjournmentTracking.connect(judge1).approveAdjournment(1, approvedTime, 'Approved')

      const newTime = Math.floor(Date.now() / 1000) + 259200
      await expect(
        adjournmentTracking.connect(judge1).emergencyReschedule(1, newTime, 'Emergency')
      )
        .to.emit(adjournmentTracking, 'HearingRescheduled')
        .withArgs(1, approvedTime, newTime, 'Emergency')
    })
  })
})