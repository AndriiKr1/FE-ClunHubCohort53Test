import React, { useState, useEffect, useRef } from "react";
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
  const [isLinkSent, setIsLinkSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  
  // Timer states
  const [remainingTime, setRemainingTime] = useState(120); // 2 minutes UI countdown
  const [canResend, setCanResend] = useState(false);
  const [isCodeExpired, setIsCodeExpired] = useState(false);
  
  // Create refs for code input boxes
  const codeInputRefs = useRef([]);
  // Initialize with 6 refs
  if (codeInputRefs.current.length !== 6) {
    codeInputRefs.current = Array(6).fill().map(() => React.createRef());
  }
  
  // Set up countdown timer when link is sent
  useEffect(() => {
    let intervalId;
    if (isLinkSent && !isCodeVerified && remainingTime > 0) {
      intervalId = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isLinkSent, isCodeVerified, remainingTime]);
  
  // Format timer for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setError("");

    // Email input
    if (!isLinkSent) {
      setEmail(val);
    }
  };
  
  // Handle code input changes
  const handleCodeChange = (index, e) => {
    const value = e.target.value;
    
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    // Update the code
    setCode(prevCode => {
      const codeArray = prevCode.split('');
      // Replace or clear the character at the current index
      codeArray[index] = value.slice(-1); // Take only the last character if multiple are pasted
      return codeArray.join('');
    });
    
    // Clear error message
    setError("");
    
    // Auto-focus to next input if a digit was entered
    if (value && index < 5) {
      codeInputRefs.current[index + 1].current.focus();
    }
  };
  
  // Handle keydown for backspace navigation
  const handleKeyDown = (index, e) => {
    // If backspace is pressed and the input is empty, focus previous input
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      codeInputRefs.current[index - 1].current.focus();
    }
  };
  
  // Handle paste for the entire code
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
    
    if (digits.length) {
      const newCode = digits.concat(Array(6 - digits.length).fill('')).join('');
      setCode(newCode);
      
      // Focus the appropriate input after paste
      const focusIndex = Math.min(digits.length, 5);
      codeInputRefs.current[focusIndex].current.focus();
    }
  };
  
  // Handle link resend
  const handleResendLink = () => {
    if (!canResend && !isCodeExpired) return;
    
    setIsSubmitting(true);
    setIsCodeExpired(false);
    setCanResend(false);
    // Reset timer to 2 minutes for UI
    setRemainingTime(120);
    setCode('');
    
    // Simulate API call to resend the password reset link
    setTimeout(() => {
      setIsSubmitting(false);
      // Link successfully resent
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

    // Email validation and link sending
    if (!isLinkSent) {
      if (!email.trim()) {
        setError("Email is required");
        return;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Please enter a valid email");
        return;
      }

      setIsSubmitting(true);
      
      // Simulate API call to send password reset link
      setTimeout(() => {
        setIsSubmitting(false);
        setIsLinkSent(true); 
        // Set initial timer to 2 minutes for UI countdown
        setRemainingTime(120);
        // Focus the first code input box
        setTimeout(() => {
          if (codeInputRefs.current[0].current) {
            codeInputRefs.current[0].current.focus();
          }
        }, 100);
      }, 2000);
    }

    // Code verification from the link
    else if (isLinkSent && !isCodeVerified) {
      if (code.length !== 6) {
        setError("Please enter all 6 digits of the verification code");
        return;
      }
      
      setIsSubmitting(true);
      
      // Simulate API call to verify the code
      // In a real app, you would check if the code is expired (> 5 minutes) or incorrect
      setTimeout(() => {
        setIsSubmitting(false);
        
        // Example of different error scenarios:
        // 1. Simulate expired code (more than 5 minutes have passed)
        if (code === "111111") {
          setIsCodeExpired(true);
          setError("Code is invalid (expired)");
          return;
        }
        // 2. Simulate incorrect code
        else if (code === "222222") {
          setError("Code is incorrect");
          return;
        }
        setIsCodeVerified(true);

        // Optional: Add a step to show a modal or additional verification
        if (code === "333333") {
          // Example of additional verification step
          const confirm = window.confirm("Do you want to proceed with password reset?");
          if (!confirm) {
            setIsCodeVerified(false);
            return;
          }
        }
      }, 1000);
    }

    // Password change
    else if (isCodeVerified) {
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
      
      // Simulate API call to change password
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
          {!isLinkSent
            ? "Recover password"
            : !isCodeVerified
            ? "Enter the code from the link"
            : "Create a new password"}
        </h2>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {!isLinkSent && (
            <>
              <input
                type="email"
                value={email}
                onChange={handleChange}
                placeholder="Enter your e-mail"
                className={styles.input}
                disabled={isSubmitting}
                noValidate
              />
              <p className={styles.infoText}>
                We'll send you a link with a password reset code that will be valid for 5 minutes
              </p>
            </>
          )}
          
          {isLinkSent && !isCodeVerified && (
            <>
              {/* Code input boxes */}
              <div className={styles.codeInputContainer} onPaste={handlePaste}>
                {Array(6).fill().map((_, index) => (
                  <input
                    key={index}
                    ref={codeInputRefs.current[index]}
                    type="text"
                    maxLength={1}
                    className={styles.codeInputBox}
                    value={code[index] || ''}
                    onChange={(e) => handleCodeChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isSubmitting}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              
              {/* Timer display */}
              <div className={styles.timerContainer}>
                {isCodeExpired ? (
                  <></>
                ) : remainingTime === 0 ? (
                  <span className={styles.timerText}>You can request a new link</span>
                ) : (
                  <span className={styles.timerText}>
                    Wait before resending: {formatTime(remainingTime)}
                  </span>
                )}
                
                {/* Resend button */}
                {(canResend || isCodeExpired) && (
                  <button 
                    type="button"
                    onClick={handleResendLink} 
                    className={styles.resendButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send a new link"}
                  </button>
                )}
              </div>
            </>
          )}
          
          {isCodeVerified && (
            <>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                placeholder="Create new password"
                className={styles.input}
                disabled={isSubmitting}
              />
              <input
                type="password"
                value={repeatPassword}
                onChange={(e) => {
                  setRepeatPassword(e.target.value);
                  setError("");
                }}
                placeholder="Repeat your new password"
                className={styles.input}
                disabled={isSubmitting}
              />
            </>
          )}

          {error && <span className={styles.error}>{error}</span>}

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {!isLinkSent
              ? isSubmitting ? "Sending..." : "Send reset link"
              : !isCodeVerified
              ? "Verify code"
              : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;