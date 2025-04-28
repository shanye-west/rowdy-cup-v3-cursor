import { useState } from "react";
import { useLocation } from "wouter";

function LoginPage() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, passcode }),
      });

      if (!response.ok) {
        throw new Error("Invalid username or passcode.");
      }

      const data = await response.json();

      if (data.mustUpdatePasscode) {
        navigate("/set-pin");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        <input
          className="border p-2 w-full mb-2"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="border p-2 w-full mb-2"
          type="password"
          placeholder="4-Digit Passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          maxLength={4}
          pattern="\d{4}"
          required
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 w-full rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
