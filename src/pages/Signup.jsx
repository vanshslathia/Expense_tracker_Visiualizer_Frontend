import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Player } from "@lottiefiles/react-lottie-player";
import { Mail, CheckCircle } from "lucide-react";
import Layout from "../components/Layout";
import { signupUser, resendVerificationEmail } from "../api/api"; 
import { showErrorToast, showSuccessToast, showInfoToast } from "../utils/toast";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resending, setResending] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      showErrorToast("Please fill in all fields.");
      return;
    }

    try {
      const response = await signupUser(formData);
      // Show verification message
      if (response?.requiresVerification) {
        setVerificationEmail(formData.email);
        setShowVerificationMessage(true);
        setFormData({ name: "", email: "", password: "" });
        showInfoToast("Please check your email to verify your account.");
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error(err); 
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    
    setResending(true);
    try {
      await resendVerificationEmail(verificationEmail);
      showSuccessToast("Verification email sent! Please check your inbox.");
    } catch (err) {
      showErrorToast("Failed to resend verification email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] p-4 transition-all duration-300">
        <div className="w-full max-w-3xl bg-white dark:bg-[#0e2433] rounded-3xl shadow-xl overflow-hidden md:flex border border-gray-200 dark:border-slate-700 hover:shadow-2xl transition-shadow duration-300">
          <div className="md:w-5/12 bg-[#001f3f] dark:bg-blue-900 p-6 flex items-center justify-center rounded-tl-3xl rounded-bl-3xl">
            <Player
              autoplay
              loop
              src="/animations/signup.json"
              style={{ height: "300px", width: "300px" }}
            />
          </div>

          <div className="md:w-7/12 p-8 md:p-10 flex items-center justify-center bg-white dark:bg-slate-900">
            <div className="w-full">
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-800 dark:text-slate-100 mb-6 text-center transition-all duration-300 transform hover:scale-105">
                Create Your Account
              </h2>

              {showVerificationMessage ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
                    <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      Verify Your Email Address
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                      We've sent a verification link to <strong>{verificationEmail}</strong>
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      Please check your inbox and click the verification link to activate your account.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleResendVerification}
                        disabled={resending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resending ? "Sending..." : "Resend Email"}
                      </button>
                      <button
                        onClick={() => {
                          setShowVerificationMessage(false);
                          navigate("/login");
                        }}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        Go to Login
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 text-slate-800 dark:text-gray-100 bg-gray-100 dark:bg-slate-800 transition-transform duration-300 hover:scale-105"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 text-slate-800 dark:text-gray-100 bg-gray-100 dark:bg-slate-800 transition-transform duration-300 hover:scale-105"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 text-slate-800 dark:text-gray-100 bg-gray-100 dark:bg-slate-800 transition-transform duration-300 hover:scale-105"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
                >
                  Signup
                </button>
              </form>
              )}

              <p className="mt-4 text-center text-sm text-slate-800 dark:text-slate-300">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-blue-600 hover:underline transition-all duration-300 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Login here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
