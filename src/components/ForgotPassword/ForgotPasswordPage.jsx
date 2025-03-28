import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, resetPassword, clearError } from "../../store/slices/authSlice";
import styles from "./ForgotPasswordPage.module.css";
import clanHubLogo from "../../assets/images/Logo2.png";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState(""); 
  const [repeatPassword, setRepeatPassword] = useState("");
  const [localError, setLocalError] = useState("");
  
  // Timer states
  const [remainingTime, setRemainingTime] = useState(120); // 2 minutes UI countdown
  const [canResend, setCanResend] = useState(false);
  const [isCodeExpired, setIsCodeExpired] = useState(false);
  
  // State to track current stage of password reset
  const [stage, setStage] = useState('email'); // 'email', 'code', 'newPassword'
  
  // Create refs for code input boxes
  const codeInputRefs = useRef([]);
  // Initialize with 6 refs
  if (codeInputRefs.current.length !== 6) {
    codeInputRefs.current = Array(6).fill().map(() => React.createRef());
  }
  
  // Clear any existing errors when component mounts or stage changes
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch, stage]);

  // Set up countdown timer when link is sent
  useEffect(() => {
    let intervalId;
    if (stage === 'code' && remainingTime > 0) {
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
  }, [stage, remainingTime]);
  
  // Format timer for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle form submission for each stage
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    try {
      if (stage === 'email') {
        // Validate email
        if (!email.trim()) {
          setLocalError("Email is required");
          return;
        }

        // Dispatch forgot password action
        await dispatch(forgotPassword(email)).unwrap();
        
        // Move to code verification stage
        setStage('code');
        setRemainingTime(120);
        setCanResend(false);
        
        // Focus first code input
        setTimeout(() => {
          if (codeInputRefs.current[0].current) {
            codeInputRefs.current[0].current.focus();
          }
        }, 100);
      } 
      else if (stage === 'code') {
        // Validate code
        if (code.length !== 6) {
          setLocalError("Please enter all 6 digits of the verification code");
          return;
        }
        
        // Move to new password stage
        setStage('newPassword');
      } 
      else if (stage === 'newPassword') {
        // Validate new password
        if (!newPassword.trim()) {
          setLocalError("New password is required");
          return;
        }
        if (newPassword !== repeatPassword) {
          setLocalError("Passwords do not match");
          return;
        }

        // Dispatch reset password action
        await dispatch(resetPassword({
          token: code,
          newPassword,
          confirmPassword: repeatPassword
        })).unwrap();

        // Navigate to login on success
        navigate('/login');
      }
    } catch (err) {
      // Handle any errors from dispatched actions
      setLocalError(err || "An error occurred");
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
    setLocalError("");
    
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
  
  // Handle link resend
  const handleResendLink = async () => {
    if (!canResend && !isCodeExpired) return;
    
    try {
      await dispatch(forgotPassword(email)).unwrap();
      
      // Reset timer
      setRemainingTime(120);
      setCanResend(false);
      setIsCodeExpired(false);
      setCode('');
    } catch (err) {
      setLocalError(err || "Failed to resend code");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <img src={clanHubLogo} alt="ClanHub Logo" className={styles.logo} />
        </div>

        <h2 className={styles.title}>
          {stage === 'email'
            ? "Recover password"
            : stage === 'code'
            ? "Enter the code from the link"
            : "Create a new password"}
        </h2>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {stage === 'email' && (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLocalError("");
                }}
                placeholder="Enter your e-mail"
                className={styles.input}
                disabled={isLoading}
                noValidate
              />
              <p className={styles.infoText}>
                We'll send you a link with a password reset code that will be valid for 5 minutes
              </p>
            </>
          )}
          
          {stage === 'code' && (
            <>
              {/* Code input boxes */}
              <div className={styles.codeInputContainer}>
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send a new link"}
                  </button>
                )}
              </div>
            </>
          )}
          
          {stage === 'newPassword' && (
            <>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setLocalError("");
                }}
                placeholder="Create new password"
                className={styles.input}
                disabled={isLoading}
              />
              <input
                type="password"
                value={repeatPassword}
                onChange={(e) => {
                  setRepeatPassword(e.target.value);
                  setLocalError("");
                }}
                placeholder="Repeat your new password"
                className={styles.input}
                disabled={isLoading}
              />
            </>
          )}

          {(localError || error) && (
            <span className={styles.error}>
              {localError || error}
            </span>
          )}

          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={isLoading}
          >
            {stage === 'email'
              ? (isLoading ? "Sending..." : "Send reset link")
              : stage === 'code'
              ? "Verify code"
              : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;