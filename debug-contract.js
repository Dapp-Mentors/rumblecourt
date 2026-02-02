import fs from 'fs';
import { ethers } from 'ethers';

async function debugContract() {
    try {
        // Read contract ABI
        const rumbleCourtAbi = JSON.parse(fs.readFileSync('artifacts/contracts/RumbleCourt.sol/RumbleCourt.json', 'utf8'));
        const deploymentArtifacts = JSON.parse(fs.readFileSync('artifacts/RumbleCourt.json', 'utf8'));
        
        // Check if running in browser
        console.log('typeof window:', typeof window);
        console.log('window.ethereum:', typeof window !== 'undefined' ? window.ethereum : 'N/A');
        
        // Try to create a contract instance
        const contractAddress = deploymentArtifacts.contract.contractAddress;
        
        // Use JSON-RPC provider for debugging
        const provider = new ethers.JsonRpcProvider('http://localhost:8545');
        
        // Get first signer from local node
        const signer = await provider.getSigner();
        
        // Create contract instance
        const contract = new ethers.Contract(contractAddress, rumbleCourtAbi.abi, signer);
        console.log('Contract created:', contract);
        
        // Check if fileCase method exists
        console.log('contract.fileCase exists:', !!contract.fileCase);
        console.log('typeof contract.fileCase:', typeof contract.fileCase);
        
        // Try to call fileCase
        try {
            const tx = await contract.fileCase('Test Case', 'QmTest');
            console.log('Transaction response:', tx);
        } catch (txError) {
            console.error('Error calling fileCase:', txError);
        }
        
    } catch (error) {
        console.error('Debug error:', error);
    }
}

debugContract();