import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ForgotPasswordPage.module.css";
import clanHubLogo from "../../assets/images/Logo2.png";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState(""); 
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeConfirmed, setIsCodeConfirmed] = useState(false);
  
  // Timer states
  const [remainingTime, setRemainingTime] = useState(120); // 2 minutes in seconds
  const [isCodeExpired, setIsCodeExpired] = useState(false);
  
  // Set up countdown timer when code is sent
  useEffect(() => {
    let intervalId;
    if (isCodeSent && !isCodeConfirmed && remainingTime > 0) {
      intervalId = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            setIsCodeExpired(true);
            clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isCodeSent, isCodeConfirmed, remainingTime]);
  
  // Format timer for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setError("");

    //email input
    if (!isCodeSent) {
      setEmail(val);
    }
   
    //code input
    else if (isCodeSent && !isCodeConfirmed) {
      if (/^\d{0,6}$/.test(val)) {
        setCode(val);
      }
    }
  };
  
  // Handle code resend
  const handleResendCode = () => {
    setIsSubmitting(true);
    setIsCodeExpired(false);
    // Reset timer to 2 minutes
    setRemainingTime(120);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Code successfully resent
    }, 2000);
  };

  // Validate password (same as registration)
  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (password.length > 25) {
      return "Password must not exceed 25 characters";
    }
    if (!/^[A-Za-z0-9!@#$%^&*()_+[\]{};':"\\|,.<>/?-]+$/.test(password)) {
      return "Only Latin letters, numbers and symbols are allowed";
    }
    if (
      !/[a-z]/.test(password) || 
      !/[A-Z]/.test(password) || 
      !/[0-9]/.test(password) || 
      !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    ) {
      return "Password must include uppercase, lowercase, number and special character";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    //email validation
    if (!isCodeSent) {
      if (!email.trim()) {
        setError("Email is required");
        return;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Please enter a valid email");
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsCodeSent(true); 
        // Set initial timer to 2 minutes
        setRemainingTime(120);
      }, 2000);
    }

    //code validation
    else if (isCodeSent && !isCodeConfirmed) {
      if (!/^\d{6}$/.test(code)) {
        setError("Enter a valid 6-digit code");
        return;
      }
      
      if (isCodeExpired) {
        setError("Code has expired. Please request a new code");
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsCodeConfirmed(true);
      }, 1000);
    }

    //password validation
    else if (isCodeConfirmed) {
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (newPassword !== repeatPassword) {
        setError("Passwords do not match");
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        alert("Password successfully changed!");
        navigate("/login");
      }, 1000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <img src={clanHubLogo} alt="ClanHub Logo" className={styles.logo} />
        </div>

        <h2 className={styles.title}>
          {!isCodeSent
            ? "Recover password"
            : !isCodeConfirmed
            ? "Enter your code"
            : "Create a new password"}
        </h2>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {!isCodeSent && (
            <input
              type="email"
              value={email}
              onChange={handleChange}
              placeholder="Enter your e-mail"
              className={styles.input}
              disabled={isSubmitting}
              noValidate
            />
          )}
          
          {isCodeSent && !isCodeConfirmed && (
            <>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                value={code}
                onChange={handleChange}
                placeholder="Enter code"
                className={styles.input}
                disabled={isSubmitting}
              />
              
              {/* Timer display */}
              <div className={styles.timerContainer}>
                <span className={styles.timerText}>
                  {isCodeExpired 
                    ? "Code expired" 
                    : `Code valid for: ${formatTime(remainingTime)}`}
                </span>
                
                {/* Resend button */}
                {(isCodeExpired || remainingTime === 0) && (
                  <button 
                    type="button"
                    onClick={handleResendCode} 
                    className={styles.resendButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Resend code"}
                  </button>
                )}
              </div>
            </>
          )}
          
          {isCodeConfirmed && (
            <>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create new password"
                className={styles.input}
                disabled={isSubmitting}
              />
              <input
                type="password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="Repeat your new password"
                className={styles.input}
                disabled={isSubmitting}
              />
            </>
          )}

          {error && <span className={styles.error}>{error}</span>}

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {!isCodeSent
              ? isSubmitting ? "Sending..." : "Send code"
              : !isCodeConfirmed
              ? "OK"
              : "Done"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;