import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { KeyRound, Mail, Loader2 } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) return

        setLoading(true)
        try {
            await signInWithEmailAndPassword(auth, email, password)
            toast({
                title: "Welcome back!",
                description: "Successfully logged in to SB Gaming Cafe.",
                className: "bg-blue-600 border-blue-500 text-white"
            })
        } catch (error: any) {
            console.error(error)
            let errorMessage = "Failed to login. Please check your credentials."
            if (error.code === 'auth/invalid-credential') {
                errorMessage = "Invalid email or password."
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Too many failed attempts. Please try again later."
            }

            toast({
                variant: "destructive",
                title: "Login Failed",
                description: errorMessage,
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
            {/* Premium Background with Depth */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] opacity-30 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[100px] opacity-30 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-4 md:p-8 relative z-10"
            >
                <div className="mb-6 md:mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-2">
                        SB <span className="font-bold text-blue-500">GAMING</span> CAFE
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base">Admin Access Portal</p>
                </div>

                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-400">Email Address</Label>
                            <div className="relative group">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@sbgaming.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-600 pl-10 focus:border-blue-500 transition-colors h-12"
                                />
                                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-400">Password</Label>
                            <div className="relative group">
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-600 pl-10 focus:border-blue-500 transition-colors h-12"
                                />
                                <KeyRound className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                "Login to Dashboard"
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-gray-600 text-xs mt-8">
                    Protected by Firebase Secure Authentication
                </p>
            </motion.div>
        </div>
    )
}
