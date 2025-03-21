import React, { useState } from "react";
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

  const handleChange = (e) => {
    const val = e.target.value;
    setError("");

    //ввод имейл
    if (!isCodeSent) {
      setEmail(val);
    }

    //ввод кода
    else if (isCodeSent && !isCodeConfirmed) {
      if (/^\d{0,6}$/.test(val)) {
        setCode(val);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    //проверка имейл
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
      }, 2000);
    }

    //проверка кода
    else if (isCodeSent && !isCodeConfirmed) {
      if (!/^\d{6}$/.test(code)) {
        setError("Enter a valid 6-digit code");
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsCodeConfirmed(true);
      }, 1000);
    }

    //ввод пароля
    else if (isCodeConfirmed) {
      if (!newPassword || !repeatPassword) {
        setError("Both password fields are required");
        return;
      }

      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters");
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

        <form className={styles.form} onSubmit={handleSubmit}>
          {!isCodeSent && (
            <input
              type="email"
              value={email}
              onChange={handleChange}
              placeholder="Enter your e-mail"
              className={styles.input}
              disabled={isSubmitting}
            />
          )}
          {isCodeSent && !isCodeConfirmed && (
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
