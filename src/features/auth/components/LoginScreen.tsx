"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Map } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
    const { signInWithGoogle } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async () => {
        setIsSigningIn(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch {
            setError("Sign-in failed. Please try again.");
            setIsSigningIn(false);
        }
    };

    return (
        <main className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
            {/* Ambient glow blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="glass-panel glow-cyan rounded-2xl p-8 w-full max-w-sm mx-4 relative z-10"
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                        <Map size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        GapMap
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Market Gap Intelligence
                    </p>
                </div>

                {/* Divider */}
                <div className="border-t border-[#2a2a3a] mb-6" />

                <p className="text-center text-xs text-gray-500 mb-4">
                    Sign in to save your chat history and access your analyses
                    anywhere.
                </p>

                {/* Google Sign-In Button */}
                <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4
                               bg-white/5 hover:bg-white/10 border border-white/10
                               hover:border-cyan-500/30 rounded-xl text-white
                               font-medium text-sm transition-all duration-200
                               disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {/* Google SVG Icon */}
                    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                        <path
                            fill="#4285F4"
                            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                        />
                        <path
                            fill="#34A853"
                            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                        />
                        <path
                            fill="#EA4335"
                            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                        />
                    </svg>
                    {isSigningIn ? "Signing in..." : "Continue with Google"}
                </button>

                {error && (
                    <p className="text-xs text-red-400 text-center mt-3">{error}</p>
                )}

                <p className="text-xs text-gray-600 text-center mt-4">
                    Your data is private and only visible to you.
                </p>
            </motion.div>
        </main>
    );
}
