"use client";

import React, { useState, useEffect } from 'react';
import { Scale, Menu, X, Gavel, BookOpen, Sparkles, Shield } from 'lucide-react';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';

const Header = () => {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();

    const handleConnect = () => {
        connect({ connector: connectors[0] }); // Use first available connector (MetaMask)
    };

    const handleDisconnect = () => {
        disconnect();
    };

    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsHydrated(true), 0);
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

    const getChainName = (chainId: number) => {
        switch (chainId) {
            case 1: return 'Ethereum';
            case 137: return 'Polygon';
            case 80002: return 'Polygon Amoy';
            default: return 'Unknown';
        }
    };

    const navLinks = [
        { label: 'Courtroom', href: '/courtroom', icon: Gavel },
        { label: 'Case History', href: '/history', icon: BookOpen },
        { label: 'Documentation', href: '/docs', icon: Shield },
        { label: 'About', href: '/about', icon: Sparkles },
    ];

    return (
        <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled
            ? 'bg-slate-950/95 backdrop-blur-xl border-b border-cyan-500/30 shadow-lg shadow-cyan-500/10'
            : 'bg-slate-950/70 backdrop-blur-lg border-b border-purple-500/20'
            }`}>
            {/* Triple animated gradient lines at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-shimmer"
                    style={{ animationDelay: '0s' }} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-shimmer"
                    style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-shimmer"
                    style={{ animationDelay: '1s' }} />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

                {/* Logo */}
                <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
                    <div className="relative">
                        <div
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500
                            rounded-lg flex items-center justify-center transform transition-all duration-300 group-hover:scale-110
                            group-hover:rotate-6 shadow-lg shadow-purple-500/50"
                        >
                            <Scale className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
                        </div>
                        {/* Pulsing glow effect */}
                        <div
                            className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 via-purple-500
                            to-pink-500 rounded-lg blur-xl opacity-0 group-hover:opacity-70 transition-all duration-300 animate-pulse-slow"
                        />
                    </div>

                    <div className="relative">
                        <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                            RUMBLECOURT
                        </span>
                        {/* Sparkle effect when connected */}
                        {isHydrated && isConnected && (
                            <Sparkles className="absolute -top-1 -right-5 w-4 h-4 text-cyan-400 animate-pulse" />
                        )}
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <button
                                key={link.href}
                                className="group relative px-4 py-2 text-sm text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2"
                            >
                                <Icon className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
                                <span>{link.label}</span>
                                {/* Animated underline */}
                                <span className="absolute bottom-0 left-4 w-0 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-[calc(100%-32px)] transition-all duration-300" />
                            </button>
                        );
                    })}
                </nav>

                {/* Right Section - Wallet & Network Info */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Network Indicator */}
                    {isHydrated && isConnected && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg border border-purple-500/30 backdrop-blur-sm">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                            <span className="text-xs text-slate-400">{getChainName(chainId)}</span>
                        </div>
                    )}

                    {/* Wallet Connection */}
                    {isHydrated ? (
                        isConnected ? (
                            <button
                                onClick={handleDisconnect}
                                className="group relative overflow-hidden"
                            >
                                <div
                                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/70 rounded-lg border
                                    border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300"
                                >
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50" />
                                    <span className="hidden sm:inline text-xs text-slate-400">Connected:</span>
                                    <span className="text-sm text-white font-mono group-hover:text-cyan-300 transition-colors duration-300">
                                        {displayAddress}
                                    </span>
                                    <X className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                                </div>
                                {/* Hover glow */}
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
                            </button>
                        ) : (
                            <div className="relative group">
                                {/* Animated border gradient */}
                                <div
                                    className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500
                                    rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-300 animate-gradient-xy"
                                />

                                <button
                                    onClick={handleConnect}
                                    className="relative bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400
                                    hover:via-purple-400 hover:to-pink-400 text-white rounded-lg font-bold transition-all duration-300
                                    text-sm px-5 py-2.5 transform hover:scale-105 shadow-lg shadow-purple-500/50"
                                >
                                    Connect Wallet
                                </button>
                            </div>
                        )
                    ) : (
                        // Loading/placeholder state during SSR
                        <div className="w-32 h-10 bg-slate-800/50 rounded-lg animate-pulse" />
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 hover:bg-slate-800/70 rounded-lg transition-all duration-300 border border-slate-700/50 hover:border-purple-500/50"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-5 h-5 text-slate-400" />
                        ) : (
                            <Menu className="w-5 h-5 text-slate-400" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-t border-slate-800/50 bg-slate-950/98 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <button
                                    key={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="group relative px-4 py-3 text-sm text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-3 hover:bg-slate-900/50 rounded-lg"
                                >
                                    <Icon className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    {link.label}
                                </button>
                            );
                        })}

                        {/* Mobile Network Indicator */}
                        {isHydrated && isConnected && (
                            <div className="mt-2 pt-2 border-t border-slate-800/50">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-lg border border-purple-500/30">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                                    <span className="text-xs text-slate-400">Connected to {getChainName(chainId)} Network</span>
                                </div>
                            </div>
                        )}

                        {/* Mobile Wallet Button */}
                        {isHydrated && !isConnected && (
                            <div className="mt-2 relative group">
                                <div
                                    className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-lg blur
                                    opacity-40 group-hover:opacity-100 transition duration-300"
                                />
                                <button
                                    onClick={handleConnect}
                                    className="relative w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white
                                    rounded-lg font-bold transition-all duration-300 text-sm px-4 py-3 shadow-lg"
                                >
                                    Connect Wallet
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;