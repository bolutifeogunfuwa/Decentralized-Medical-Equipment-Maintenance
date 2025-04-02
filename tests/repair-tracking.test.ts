import { describe, it, expect, beforeEach } from "vitest"

// Mock implementation for testing Clarity contracts

// Mock contract state
let lastRepairId = 0
const repairs = new Map()
const repairActions = new Map()

// Mock block height (for timestamp simulation)
let blockHeight = 100000

// Mock tx-sender
let txSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"

// Mock device registration contract
function mockGetDeviceOwner(deviceId: number) {
  if (deviceId === 1) {
    return { result: { value: { owner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" } } }
  }
  return { result: { value: null } }
}

// Mock contract functions
function reportIssue(deviceId: number, issueDescription: string, priority: string) {
  const newId = lastRepairId + 1
  lastRepairId = newId
  
  repairs.set(newId, {
    deviceId,
    reportedBy: txSender,
    issueDescription,
    reportedDate: blockHeight,
    status: "reported",
    priority,
  })
  
  return { result: { value: newId } }
}

function getRepair(repairId: number) {
  return repairs.has(repairId) ? { result: { value: repairs.get(repairId) } } : { result: { value: null } }
}

function updateRepairStatus(repairId: number, newStatus: string) {
  if (!repairs.has(repairId)) {
    return { result: { error: 404 } }
  }
  
  const repair = repairs.get(repairId)
  const deviceOwner = mockGetDeviceOwner(repair.deviceId)
  
  if (!deviceOwner.result.value) {
    return { result: { error: 404 } }
  }
  
  if (deviceOwner.result.value.owner !== txSender) {
    return { result: { error: 403 } }
  }
  
  repairs.set(repairId, { ...repair, status: newStatus })
  
  return { result: { value: true } }
}

function addRepairAction(repairId: number, actionDescription: string, partsReplaced: string, cost: number) {
  if (!repairs.has(repairId)) {
    return { result: { error: 404 } }
  }
  
  const repair = repairs.get(repairId)
  const actionKey = `${repairId}-${blockHeight}`
  
  repairActions.set(actionKey, {
    performedBy: txSender,
    actionDescription,
    partsReplaced,
    cost,
  })
  
  return { result: { value: true } }
}

function getRepairAction(repairId: number, actionTimestamp: number) {
  const actionKey = `${repairId}-${actionTimestamp}`
  return repairActions.has(actionKey)
      ? { result: { value: repairActions.get(actionKey) } }
      : { result: { value: null } }
}

describe("Repair Tracking Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    lastRepairId = 0
    repairs.clear()
    repairActions.clear()
    blockHeight = 100000
    txSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  })
  
  describe("reportIssue", () => {
    it("should report an issue and return the repair ID", () => {
      const result = reportIssue(1, "Display showing artifacts", "high")
      
      expect(result.result.value).toBe(1)
      expect(repairs.size).toBe(1)
      expect(repairs.get(1)).toEqual({
        deviceId: 1,
        reportedBy: txSender,
        issueDescription: "Display showing artifacts",
        reportedDate: blockHeight,
        status: "reported",
        priority: "high",
      })
    })
    
    it("should increment repair ID for each new issue", () => {
      reportIssue(1, "Issue 1", "low")
      const result = reportIssue(2, "Issue 2", "medium")
      
      expect(result.result.value).toBe(2)
      expect(repairs.size).toBe(2)
    })
  })
  
  describe("getRepair", () => {
    it("should return repair details for a valid repair ID", () => {
      reportIssue(1, "Display showing artifacts", "high")
      const result = getRepair(1)
      
      expect(result.result.value).toEqual({
        deviceId: 1,
        reportedBy: txSender,
        issueDescription: "Display showing artifacts",
        reportedDate: blockHeight,
        status: "reported",
        priority: "high",
      })
    })
    
    it("should return null for an invalid repair ID", () => {
      const result = getRepair(999)
      expect(result.result.value).toBeNull()
    })
  })
  
  describe("updateRepairStatus", () => {
    it("should update the status of a repair", () => {
      reportIssue(1, "Display showing artifacts", "high")
      const result = updateRepairStatus(1, "in-progress")
      
      expect(result.result.value).toBe(true)
      expect(repairs.get(1).status).toBe("in-progress")
    })
    
    it("should return error for non-existent repair", () => {
      const result = updateRepairStatus(999, "in-progress")
      expect(result.result.error).toBe(404)
    })
    
    it("should return error if caller is not the device owner", () => {
      reportIssue(1, "Display showing artifacts", "high")
      txSender = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" // Different sender
      
      const result = updateRepairStatus(1, "in-progress")
      expect(result.result.error).toBe(403)
    })
  })
  
  describe("addRepairAction", () => {
    it("should add a repair action", () => {
      reportIssue(1, "Display showing artifacts", "high")
      const result = addRepairAction(1, "Replaced display module", "Display module v2", 500)
      
      expect(result.result.value).toBe(true)
      
      const actionKey = `1-${blockHeight}`
      expect(repairActions.has(actionKey)).toBe(true)
      expect(repairActions.get(actionKey)).toEqual({
        performedBy: txSender,
        actionDescription: "Replaced display module",
        partsReplaced: "Display module v2",
        cost: 500,
      })
    })
    
    it("should return error for non-existent repair", () => {
      const result = addRepairAction(999, "Action", "Parts", 100)
      expect(result.result.error).toBe(404)
    })
  })
  
  describe("getRepairAction", () => {
    it("should return repair action for a valid action", () => {
      reportIssue(1, "Display showing artifacts", "high")
      addRepairAction(1, "Replaced display module", "Display module v2", 500)
      
      const result = getRepairAction(1, blockHeight)
      
      expect(result.result.value).toEqual({
        performedBy: txSender,
        actionDescription: "Replaced display module",
        partsReplaced: "Display module v2",
        cost: 500,
      })
    })
    
    it("should return null for a non-existent repair action", () => {
      const result = getRepairAction(1, 999999)
      expect(result.result.value).toBeNull()
    })
  })
})

