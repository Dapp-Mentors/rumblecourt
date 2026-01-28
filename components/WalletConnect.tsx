// WalletConnect component for MetaMask/WalletConnect integration
import React from "react";

const WalletConnect: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Connect Your Wallet
      </h3>
      <p className="text-gray-600 mb-4">
        Ready for MetaMask/WalletConnect integration
      </p>
      <button className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600">
        Connect Wallet
      </button>
    </div>
  );
};

export default WalletConnect;