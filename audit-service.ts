import type { AuditResult } from "@/types/audit"

// Mock data for demonstration purposes
const mockAuditResults: { [key: string]: AuditResult } = {
  "audit-123": {
    id: "audit-123",
    timestamp: new Date().toISOString(),
    codeSnippet: `
pragma solidity ^0.8.0;

contract SimpleVulnerableContract {
    uint public balance;

    constructor() {
        balance = 0;
    }

    function deposit() public payable {
        balance += msg.value;
    }

    function withdraw(uint _amount) public {
        require(balance >= _amount, "Insufficient balance");
        // Potential reentrancy vulnerability if external call is made before state update
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        balance -= _amount; // State update after external call
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
    `,
    score: 65,
    vulnerabilities: [
      {
        type: "Reentrancy",
        severity: "High",
        description:
          "The withdraw function is vulnerable to reentrancy attacks because the state variable 'balance' is updated after an external call to msg.sender.call.",
        line: 19,
        file: "SimpleVulnerableContract.sol",
      },
      {
        type: "Integer Overflow/Underflow",
        severity: "Medium",
        description:
          "While not directly present in this snippet, unchecked math operations can lead to integer overflows/underflows in older Solidity versions or if 'unchecked' block is used.",
        line: 0, // Line 0 indicates general contract vulnerability
        file: "SimpleVulnerableContract.sol",
      },
      {
        type: "Front-running",
        severity: "Low",
        description:
          "Functions relying on transaction order might be susceptible to front-running, though not explicitly shown here.",
        line: 0,
        file: "SimpleVulnerableContract.sol",
      },
    ],
    recommendations: [
      "Implement Checks-Effects-Interactions pattern to prevent reentrancy.",
      "Use OpenZeppelin's ReentrancyGuard for critical functions.",
      "Consider using SafeMath or Solidity 0.8.0+ default checked arithmetic for integer operations.",
      "Minimize external calls and untrusted code interactions.",
      "Conduct thorough unit and integration testing.",
    ],
  },
  "audit-456": {
    id: "audit-456",
    timestamp: new Date().toISOString(),
    codeSnippet: `
pragma solidity ^0.8.0;

contract SecureContract {
    uint public value;
    address public owner;

    event ValueSet(uint oldValue, uint newValue);

    constructor() {
        owner = msg.sender;
        value = 0;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function setValue(uint _newValue) public onlyOwner {
        emit ValueSet(value, _newValue);
        value = _newValue;
    }

    function getValue() public view returns (uint) {
        return value;
    }
}
    `,
    score: 95,
    vulnerabilities: [],
    recommendations: [
      "Consider adding a timelock for critical owner functions.",
      "Implement a multi-signature wallet for owner control.",
      "Regularly review access control mechanisms.",
    ],
  },
}

export async function performAudit(code: string): Promise<AuditResult> {
  console.log("Performing audit for code:", code.substring(0, 100) + "...")

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // In a real application, you would send the code to an AI backend
  // and receive a real audit result. For now, we'll return a mock result.
  // You could use a simple hash of the code to return different mock results
  // or just return a fixed one.
  const mockId = code.includes("SimpleVulnerableContract") ? "audit-123" : "audit-456"
  const result = mockAuditResults[mockId] || {
    id: `audit-${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date().toISOString(),
    codeSnippet: code,
    score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
    vulnerabilities: [],
    recommendations: ["No major vulnerabilities detected. Good job!", "Consider gas optimizations."],
  }

  return result
}

export async function getAuditResult(auditId: string): Promise<AuditResult | null> {
  console.log("Fetching audit result for ID:", auditId)

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return mockAuditResults[auditId] || null
}
