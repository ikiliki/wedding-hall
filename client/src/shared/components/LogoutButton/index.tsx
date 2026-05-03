import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { createClient } from "@/shared/lib/supabase";
import * as styles from "./LogoutButton.styles";

type LogoutButtonProps = {
  /** Where to send the browser after sign-out (default `/`). */
  redirectAfterLogout?: string;
};

export function LogoutButton({ redirectAfterLogout = "/" }: LogoutButtonProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    navigate(redirectAfterLogout, { replace: true });
  }

  return (
    <div className={styles.wrap}>
      <Button type="button" variant="ghost" onClick={handleLogout}>
        התנתקות
      </Button>
    </div>
  );
}

export default LogoutButton;
