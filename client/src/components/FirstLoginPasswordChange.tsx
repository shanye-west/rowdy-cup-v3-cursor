import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const FirstLoginPasswordChange = ({ onComplete }: { onComplete: () => void }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Only allow digits (0-9) in the PIN
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (/^\d*$/.test(input) && input.length <= 4) {
      setNewPassword(input);
      setError("");
    }
  };

  const handleConfirmPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (/^\d*$/.test(input) && input.length <= 4) {
      setConfirmPassword(input);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (newPassword.length !== 4) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("PINs do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest("POST", "/api/change-password", {
        newPassword,
      });
      
      if (res.ok) {
        toast({
          title: "PIN changed successfully",
          description: "Your PIN has been updated.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        onComplete();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to change PIN");
      }
    } catch (err) {
      setError("An error occurred while changing your PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-2">Change Your PIN</h2>
        <p className="text-gray-600 mb-4">
          You must change your PIN before continuing. Please enter a new 4-digit PIN.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">New PIN</label>
              <input
                type="password"
                value={newPassword}
                onChange={handlePinChange}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter 4-digit PIN"
                pattern="\d{4}"
                maxLength={4}
                inputMode="numeric"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm PIN</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPinChange}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Confirm 4-digit PIN"
                pattern="\d{4}"
                maxLength={4}
                inputMode="numeric"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </span>
                ) : (
                  "Change PIN"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FirstLoginPasswordChange;