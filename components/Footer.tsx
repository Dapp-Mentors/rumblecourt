"use client";

import React from 'react';
import { Scale, Github, Twitter, Linkedin, Heart, Shield, BookOpen, Gavel } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-slate-950/90 backdrop-blur-lg text-white py-8 sm:py-12 lg:py-16 border-t border-cyan-500/20 relative overflow-hidden">
            {/* Triple animated gradient lines at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-shimmer"
                    style={{ animationDelay: '0s' }} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-shimmer"
                    style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-shimmer"
                    style={{ animationDelay: '1s' }} />
            </div>

            {/* Gradient orbs background */}
            <div className="absolute top-0 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-0 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '3s' }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">

                    {/* Brand Section */}
                    <div className="sm:col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 group cursor-pointer">
                            <div className="relative">
                                <div
                                    className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500
                                    rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:rotate-12
                                    transition-all duration-300"
                                >
                                    <Scale className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
                                </div>
                                <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 via-purple-500
                                to-pink-500 rounded-lg blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300"
                                />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400
                                to-pink-400 bg-clip-text text-transparent animate-gradient-x"
                                >
                                    RUMBLECOURT
                                </h3>
                                <p className="text-slate-400 text-xs sm:text-sm">AI-Driven Courtroom Simulator</p>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                            Experience the future of legal simulation with AI-powered courtroom battles. Preview case outcomes before real-world litigation with blockchain transparency.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3 sm:gap-4">
                            <a
                                href="https://github.com/Dapp-Mentors/rumblecourt"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative w-10 h-10 sm:w-11 sm:h-11 bg-slate-800/50 rounded-lg flex
                                items-center justify-center hover:bg-gradient-to-r hover:from-cyan-500 hover:to-purple-500
                                transition-all duration-300 transform hover:scale-110 overflow-hidden border border-slate-700/50
                                hover:border-transparent"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <Github className="w-5 h-5 text-slate-400 group-hover:text-white relative z-10 transition-colors duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                            </a>

                            <a
                                href="https://twitter.com/rumblecourt"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative w-10 h-10 sm:w-11 sm:h-11 bg-slate-800/50 rounded-lg flex
                                items-center justify-center hover:bg-gradient-to-r hover:from-cyan-500 hover:to-purple-500
                                transition-all duration-300 transform hover:scale-110 overflow-hidden border border-slate-700/50
                                hover:border-transparent"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <Twitter className="w-5 h-5 text-slate-400 group-hover:text-white relative z-10 transition-colors duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                            </a>

                            <a
                                href="https://linkedin.com/company/rumblecourt"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative w-10 h-10 sm:w-11 sm:h-11 bg-slate-800/50 rounded-lg flex items-center
                                justify-center hover:bg-gradient-to-r hover:from-cyan-500 hover:to-purple-500 transition-all
                                duration-300 transform hover:scale-110 overflow-hidden border border-slate-700/50 hover:border-transparent"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <Linkedin className="w-5 h-5 text-slate-400 group-hover:text-white relative z-10 transition-colors duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                            </a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
                            <Gavel className="w-4 h-4 text-cyan-400" />
                            Product
                        </h4>
                        <ul className="space-y-2.5">
                            <li>
                                <Link href="/courtroom" className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    Courtroom
                                </Link>
                            </li>
                            <li>
                                <Link href="/history" className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    Case History
                                </Link>
                            </li>
                            <li>
                                <button className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    AI Lawyers
                                </button>
                            </li>
                            <li>
                                <button className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    Blockchain Records
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-purple-400" />
                            Resources
                        </h4>
                        <ul className="space-y-2.5">
                            <li>
                                <Link href="/docs" className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <button className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    API Reference
                                </button>
                            </li>
                            <li>
                                <button className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    Smart Contracts
                                </button>
                            </li>
                            <li>
                                <button className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    Tutorials
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
                            <Shield className="w-4 h-4 text-pink-400" />
                            Company
                        </h4>
                        <ul className="space-y-2.5">
                            <li>
                                <Link href="/about" className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <button className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    Team
                                </button>
                            </li>
                            <li>
                                <button className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    Contact
                                </button>
                            </li>
                            <li>
                                <button className="group text-sm sm:text-base text-slate-400 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2">
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-2 transition-all duration-300" />
                                    Blog
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-slate-800/50 pt-6 sm:pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs sm:text-sm gap-4 sm:gap-0">
                        <div className="text-center md:text-left">
                            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                                <span>© {new Date().getFullYear()} RumbleCourt. All rights reserved.</span>
                                <span className="hidden sm:inline text-slate-600">•</span>
                                <span className="flex items-center gap-1.5">
                                    Made with <Heart className="w-3.5 h-3.5 text-red-500 animate-pulse" /> by
                                    <span className="text-cyan-400 font-semibold">DappMentors</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                            <button className="hover:text-cyan-300 transition-colors duration-300 relative group">
                                Privacy Policy
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-full transition-all duration-300" />
                            </button>
                            <button className="hover:text-cyan-300 transition-colors duration-300 relative group">
                                Terms of Service
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-full transition-all duration-300" />
                            </button>
                            <button className="hover:text-cyan-300 transition-colors duration-300 relative group">
                                Legal
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-full transition-all duration-300" />
                            </button>
                        </div>
                    </div>

                    {/* Hackathon Badge */}
                    <div className="mt-6 flex justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-sm border border-purple-500/30 rounded-full">
                            <Shield className="w-4 h-4 text-purple-400" />
                            <span className="text-xs text-slate-400">
                                Built for Encode Club Comet Resolution v2 Hackathon
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;