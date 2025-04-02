import { describe, it, expect, beforeEach } from "vitest"

// Mock implementation for testing Clarity contracts
// In a real environment, you would use a testing framework specific to Clarity

// Mock contract state
let lastDeviceId = 0
const devices = new Map()
const deviceOwners = new Map()

// Mock tx-sender (current user/caller)
let txSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"

// Mock contract functions
function registerDevice(
    name: string,
    model: string,
    serialNumber: string,
    manufacturer: string,
    purchaseDate: number,
    warrantyExpiry: number,
    department: string,
) {
  const newId = lastDeviceId + 1
  lastDeviceId = newId
  
  devices.set(newId, {
    name,
    model,
    serialNumber,
    manufacturer,
    purchaseDate,
    warrantyExpiry,
    department,
    status: "active",
  })
  
  deviceOwners.set(newId, txSender)
  
  return { result: { value: newId } }
}

function getDevice(deviceId: number) {
  return devices.has(deviceId) ? { result: { value: devices.get(deviceId) } } : { result: { value: null } }
}

function getDeviceOwner(deviceId: number) {
  return deviceOwners.has(deviceId) ? { result: { value: deviceOwners.get(deviceId) } } : { result: { value: null } }
}

function updateDeviceStatus(deviceId: number, newStatus: string) {
  if (!devices.has(deviceId)) {
    return { result: { error: 404 } }
  }
  
  const owner = deviceOwners.get(deviceId)
  if (owner !== txSender) {
    return { result: { error: 403 } }
  }
  
  const device = devices.get(deviceId)
  devices.set(deviceId, { ...device, status: newStatus })
  
  return { result: { value: true } }
}

function transferDevice(deviceId: number, newOwner: string) {
  if (!deviceOwners.has(deviceId)) {
    return { result: { error: 404 } }
  }
  
  const owner = deviceOwners.get(deviceId)
  if (owner !== txSender) {
    return { result: { error: 403 } }
  }
  
  deviceOwners.set(deviceId, newOwner)
  
  return { result: { value: true } }
}

describe("Device Registration Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    lastDeviceId = 0
    devices.clear()
    deviceOwners.clear()
    txSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  })
  
  describe("registerDevice", () => {
    it("should register a new device and return the device ID", () => {
      const result = registerDevice(
          "MRI Scanner",
          "Model XYZ-123",
          "SN-456789",
          "Medical Imaging Corp",
          1643673600,
          1706745600,
          "Radiology",
      )
      
      expect(result.result.value).toBe(1)
      expect(devices.size).toBe(1)
      expect(deviceOwners.size).toBe(1)
      
      const device = getDevice(1).result.value
      expect(device).toEqual({
        name: "MRI Scanner",
        model: "Model XYZ-123",
        serialNumber: "SN-456789",
        manufacturer: "Medical Imaging Corp",
        purchaseDate: 1643673600,
        warrantyExpiry: 1706745600,
        department: "Radiology",
        status: "active",
      })
    })
    
    it("should increment device ID for each new device", () => {
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      const result = registerDevice("CT Scanner", "Model B", "SN2", "Vendor B", 3, 4, "Dept B")
      
      expect(result.result.value).toBe(2)
      expect(devices.size).toBe(2)
      
      const device1 = getDevice(1).result.value
      const device2 = getDevice(2).result.value
      
      expect(device1.name).toBe("MRI Scanner")
      expect(device2.name).toBe("CT Scanner")
    })
    
    it("should set the device status to active by default", () => {
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      const device = getDevice(1).result.value
      
      expect(device.status).toBe("active")
    })
    
    it("should set the caller as the device owner", () => {
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      const owner = getDeviceOwner(1).result.value
      
      expect(owner).toBe(txSender)
    })
  })
  
  describe("getDevice", () => {
    it("should return device details for a valid device ID", () => {
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      const result = getDevice(1)
      
      expect(result.result.value).toEqual({
        name: "MRI Scanner",
        model: "Model A",
        serialNumber: "SN1",
        manufacturer: "Vendor A",
        purchaseDate: 1,
        warrantyExpiry: 2,
        department: "Dept A",
        status: "active",
      })
    })
    
    it("should return null for an invalid device ID", () => {
      const result = getDevice(999)
      expect(result.result.value).toBeNull()
    })
  })
  
  describe("getDeviceOwner", () => {
    it("should return the owner for a valid device ID", () => {
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      const result = getDeviceOwner(1)
      
      expect(result.result.value).toBe(txSender)
    })
    
    it("should return null for an invalid device ID", () => {
      const result = getDeviceOwner(999)
      expect(result.result.value).toBeNull()
    })
  })
  
  describe("updateDeviceStatus", () => {
    it("should update the status of a device", () => {
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      const result = updateDeviceStatus(1, "maintenance")
      
      expect(result.result.value).toBe(true)
      
      const device = getDevice(1).result.value
      expect(device.status).toBe("maintenance")
    })
    
    it("should return error for non-existent device", () => {
      const result = updateDeviceStatus(999, "maintenance")
      expect(result.result.error).toBe(404)
    })
    
    it("should return error if caller is not the owner", () => {
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      txSender = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" // Different sender
      
      const result = updateDeviceStatus(1, "maintenance")
      expect(result.result.error).toBe(403)
    })
    
    it("should allow multiple status updates", () => {
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      
      updateDeviceStatus(1, "maintenance")
      const result = updateDeviceStatus(1, "inactive")
      
      expect(result.result.value).toBe(true)
      
      const device = getDevice(1).result.value
      expect(device.status).toBe("inactive")
    })
  })
  
  describe("transferDevice", () => {
    it("should transfer ownership of a device", () => {
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      const newOwner = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      
      const result = transferDevice(1, newOwner)
      
      expect(result.result.value).toBe(true)
      
      const owner = getDeviceOwner(1).result.value
      expect(owner).toBe(newOwner)
    })
    
    it("should return error for non-existent device", () => {
      const result = transferDevice(999, "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM")
      expect(result.result.error).toBe(404)
    })
    
    it("should return error if caller is not the owner", () => {
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      txSender = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" // Different sender
      
      const result = transferDevice(1, "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM")
      expect(result.result.error).toBe(403)
    })
    
    it("should allow the new owner to update the device status", () => {
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      const newOwner = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      
      transferDevice(1, newOwner)
      
      // Set tx-sender to the new owner
      txSender = newOwner
      
      const result = updateDeviceStatus(1, "maintenance")
      expect(result.result.value).toBe(true)
      
      const device = getDevice(1).result.value
      expect(device.status).toBe("maintenance")
    })
    
    it("should prevent the previous owner from updating the device status", () => {
      const originalOwner = txSender
      registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A")
      const newOwner = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      
      transferDevice(1, newOwner)
      
      // Keep tx-sender as the original owner
      txSender = originalOwner
      
      const result = updateDeviceStatus(1, "maintenance")
      expect(result.result.error).toBe(403)
    })
  })
  
  describe("Integration tests", () => {
    it("should handle a complete device lifecycle", () => {
      // Register a device
      const deviceId = registerDevice(
          "MRI Scanner",
          "Model XYZ-123",
          "SN-456789",
          "Medical Imaging Corp",
          1643673600,
          1706745600,
          "Radiology",
      ).result.value
      
      // Update status to maintenance
      updateDeviceStatus(deviceId, "maintenance")
      expect(getDevice(deviceId).result.value.status).toBe("maintenance")
      
      // Transfer to a new owner
      const newOwner = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      transferDevice(deviceId, newOwner)
      expect(getDeviceOwner(deviceId).result.value).toBe(newOwner)
      
      // New owner updates status
      txSender = newOwner
      updateDeviceStatus(deviceId, "active")
      expect(getDevice(deviceId).result.value.status).toBe("active")
      
      // Transfer to another owner
      const thirdOwner = "ST4PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      transferDevice(deviceId, thirdOwner)
      expect(getDeviceOwner(deviceId).result.value).toBe(thirdOwner)
    })
    
    it("should handle multiple devices with different owners", () => {
      // First owner registers a device
      const device1Id = registerDevice("MRI Scanner", "Model A", "SN1", "Vendor A", 1, 2, "Dept A").result.value
      
      // Second owner registers a device
      const secondOwner = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      txSender = secondOwner
      const device2Id = registerDevice("CT Scanner", "Model B", "SN2", "Vendor B", 3, 4, "Dept B").result.value
      
      // Verify owners
      expect(getDeviceOwner(device1Id).result.value).not.toBe(secondOwner)
      expect(getDeviceOwner(device2Id).result.value).toBe(secondOwner)
      
      // First owner can't update second owner's device
      txSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const result = updateDeviceStatus(device2Id, "maintenance")
      expect(result.result.error).toBe(403)
    })
  })
})

