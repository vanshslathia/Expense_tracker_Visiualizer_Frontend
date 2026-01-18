import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Player } from "@lottiefiles/react-lottie-player";
import { CheckCircle, XCircle, Mail } from "lucide-react";
import Layout from "../components/Layout";
import { verifyEmail, resendVerificationEmail } from "../api/api";
import { showSuccessToast, showErrorToast } from "../utils/toast";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying, success, error, expired
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    console.log("🔍 VerifyEmail page loaded, token:", token ? token.substring(0, 10) + "..." : "missing");
    if (!token) {
      console.warn("⚠️ No token in URL");
      setStatus("error");
      return;
    }

    verifyEmailToken(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const verifyEmailToken = async (token) => {
    console.log("🔄 Verifying email token...");
    try {
      const response = await verifyEmail(token);
      console.log("✅ Verification response:", response);
      if (response && response.success) {
        setStatus("success");
        showSuccessToast("Email verified successfully! You can now log in.");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setStatus("error");
        showErrorToast(response?.msg || "Verification failed");
      }
    } catch (err) {
      console.error("❌ Verification error:", err);
      const errorMsg = err.response?.data?.msg || err.response?.data?.message || "Verification failed";
      if (err.response?.data?.tokenExpired) {
        setStatus("expired");
      } else {
        setStatus("error");
      }
      showErrorToast(errorMsg);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showErrorToast("Email address is required");
      return;
    }

    try {
      await resendVerificationEmail(email);
      showSuccessToast("Verification email sent! Please check your inbox.");
    } catch (err) {
      showErrorToast("Failed to resend verification email");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] p-4 transition-all duration-300">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="p-8 md:p-12 text-center">
            {status === "verifying" && (
              <>
                <div className="mb-6">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                </div>
                <h2 className="text-3xl font-semibold text-slate-800 dark:text-white mb-4">
                  Verifying Your Email
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Please wait while we verify your email address...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl font-semibold text-slate-800 dark:text-white mb-4">
                  Email Verified Successfully!
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Your email address has been verified. You can now log in to your account.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Go to Login
                </button>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                  Redirecting to login page in 3 seconds...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h2 className="text-3xl font-semibold text-slate-800 dark:text-white mb-4">
                  Verification Failed
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  The verification link is invalid or has already been used.
                </p>
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full max-w-md mx-auto p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-white bg-gray-100 dark:bg-slate-800"
                    />
                  </div>
                  <button
                    onClick={handleResend}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Resend Verification Email
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="block mx-auto px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    Go to Login
                  </button>
                </div>
              </>
            )}

            {status === "expired" && (
              <>
                <Mail className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
                <h2 className="text-3xl font-semibold text-slate-800 dark:text-white mb-4">
                  Verification Link Expired
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  The verification link has expired. Please request a new verification email.
                </p>
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full max-w-md mx-auto p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-white bg-gray-100 dark:bg-slate-800"
                    />
                  </div>
                  <button
                    onClick={handleResend}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Resend Verification Email
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="block mx-auto px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    Go to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
