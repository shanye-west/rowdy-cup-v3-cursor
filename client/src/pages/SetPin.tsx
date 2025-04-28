import { useState } from "react";
import { useLocation } from "wouter";

function SetPinPage() {
  const [, navigate] = useLocation();
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPasscode.length !== 4 || confirmPasscode.length !== 4) {
      setError("Passcode must be exactly 4 digits.");
      return;
    }

    if (newPasscode !== confirmPasscode) {
      setError("Passcodes do not match.");
      return;
    }

    try {
      const response = await fetch("/api/update-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPasscode }),
      });

      if (!response.ok) {
        throw new Error("Failed to update passcode.");
      }

      navigate("/"); // Go to Home after setting new PIN
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Set Your 4-Digit PIN</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <input
          className="border p-2 w-full mb-2"
          type="password"
          placeholder="New 4-Digit PIN"
          value={newPasscode}
          onChange={(e) => setNewPasscode(e.target.value)}
          maxLength={4}
          pattern="\d{4}"
          required
        />
        <input
          className="border p-2 w-full mb-2"
          type="password"
          placeholder="Confirm New 4-Digit PIN"
          value={confirmPasscode}
          onChange={(e) => setConfirmPasscode(e.target.value)}
          maxLength={4}
          pattern="\d{4}"
          required
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 w-full rounded"
        >
          Set PIN
        </button>
      </form>
    </div>
  );
}

export default SetPinPage;
