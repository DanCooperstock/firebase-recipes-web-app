import { FormEvent, useState } from "react";
import FirebaseAuthService from "../FirebaseAuthService";
import React from "react";
import firebase from "../FirebaseConfig";

type LoginFormProps = {
  existingUser: firebase.User | null;
};

const LoginForm = ({ existingUser }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      await FirebaseAuthService.loginUser(username, password);
      setUsername("");
      setPassword("");
    } catch (error: any) {
      // not ideal: using specific text of error message for test!
      if (error.message.indexOf("There is no user record") >= 0) {
        if (
          window.confirm(
            `There is no login for the email address ${username}` +
              ", would you like to create one with your specified password?"
          )
        ) {
          try {
            await FirebaseAuthService.registerUser(username, password);
            setUsername("");
            setPassword("");
          } catch (error2: any) {
            alert(error2.message);
          }
        }
        return;
      }
      alert(error.message);
    }
  }

  async function handleReset() {
    if (!username) {
      alert("Missing username");
      return;
    }
    try {
      await FirebaseAuthService.sendPasswordResetEmail(username);
      alert(
        "An email that will allow you to reset your password has been sent."
      );
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleLoginWithGoogle() {
    try {
      await FirebaseAuthService.loginWithGoogle();
    } catch (error: any) {
      alert(error.message);
    }
  }

  function handleLogout() {
    FirebaseAuthService.logoutUser();
  }

  return (
    <div className="login-form-container">
      {existingUser ? (
        <div className="row">
          <h3>Welcome, {existingUser.email}</h3>
          <button
            type="button"
            className="primary-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="login-form">
          <label className="input-label login-label">
            Username (email):
            <input
              type="email"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-text"
            />
          </label>
          <label className="input-label login-label">
            Password:
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-text"
            />
          </label>
          <div className="button-box">
            <button className="primary-button">Login</button>
            <button
              type="button"
              onClick={handleReset}
              className="primary-button"
            >
              Reset Password
            </button>
            <button
              type="button"
              onClick={handleLoginWithGoogle}
              className="primary-button"
            >
              Login with Google
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginForm;
